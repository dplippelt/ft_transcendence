import threading
from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import ErrorCode, bad_request, conflict, forbidden, not_found
from app.db.utils import commit_or_bad_request
from app.models.lobby import Lobby
from app.models.lobby_member import LobbyMember
from app.models.lobby_message import LobbyMessage
from app.models.user import User
from app.services.friend_service import get_friendship, utc_now

HOST = "host"
GUEST = "guest"
MAX_MEMBERS = 2
MAX_MESSAGE_HISTORY = 200

INVITE_COOLDOWN = timedelta(seconds=30)

# Separate from INVITE_COOLDOWN: the cooldown only blocks re-inviting the
# *same* friend, so without this a host could still fan out invites to many
# different friends back-to-back with no throttling at all.
INVITE_RATE_LIMIT_WINDOW = timedelta(seconds=10)
INVITE_RATE_LIMIT_MAX = 5

# In-process only, same tradeoff as ConnectionManager: fine for a
# single-process deployment, just a spam guard rather than a source of
# truth, so losing it on restart or missing it across workers is fine.
# Guarded by _recent_invites_lock since route handlers are sync `def`s and
# run on real threadpool threads, not serialized coroutines.
_recent_invites: dict[tuple[int, int], datetime] = {}
_invite_send_times: dict[int, list[datetime]] = {}
_recent_invites_lock = threading.Lock()


def _lobby_query(db: Session):
    return (
        db.query(Lobby)
        .options(joinedload(Lobby.members).joinedload(LobbyMember.user))
    )


def list_lobbies(db: Session) -> list[Lobby]:
    return (
        _lobby_query(db)
        .order_by(Lobby.created_at.desc())
        .all()
    )


def get_lobby_by_id(db: Session, lobby_id: int) -> Lobby | None:
    return (
        _lobby_query(db)
        .filter(Lobby.id == lobby_id)
        .first()
    )


def get_member(db: Session, lobby_id: int, user_id: int) -> LobbyMember | None:
    return (
        db.query(LobbyMember)
        .filter(
            LobbyMember.lobby_id == lobby_id,
            LobbyMember.user_id == user_id,
        )
        .first()
    )


def create_lobby(db: Session, user: User, name: str) -> Lobby:
    existing = db.query(Lobby).filter(func.lower(Lobby.name) == name.lower()).first()

    if existing:
        raise conflict("A lobby with this name already exists.", code=ErrorCode.LOBBY_NAME_ALREADY_EXISTS)

    lobby = Lobby(name=name)
    db.add(lobby)
    db.add(LobbyMember(lobby=lobby, user=user, role=HOST))

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise conflict("A lobby with this name already exists.", code=ErrorCode.LOBBY_NAME_ALREADY_EXISTS)

    db.refresh(lobby)

    return lobby


def join_lobby(db: Session, user: User, lobby_id: int) -> Lobby:
    # Locks the lobby row so concurrent joins serialize instead of both
    # reading the same member count and both passing the MAX_MEMBERS check.
    lobby = (
        db.query(Lobby)
        .filter(Lobby.id == lobby_id)
        .with_for_update()
        .first()
    )

    if lobby is None:
        raise not_found("Lobby not found.", code=ErrorCode.LOBBY_NOT_FOUND)

    if get_member(db, lobby_id, user.id) is not None:
        return get_lobby_by_id(db, lobby_id)

    member_count = (
        db.query(LobbyMember)
        .filter(LobbyMember.lobby_id == lobby_id)
        .count()
    )

    if member_count >= MAX_MEMBERS:
        raise conflict("This lobby is full.", code=ErrorCode.LOBBY_FULL)

    db.add(LobbyMember(lobby=lobby, user=user, role=GUEST))
    commit_or_bad_request(db, "Could not join lobby.")

    return get_lobby_by_id(db, lobby_id)


def get_lobby_or_404(db: Session, lobby_id: int) -> Lobby:
    lobby = db.query(Lobby).filter(Lobby.id == lobby_id).first()

    if lobby is None:
        raise not_found("Lobby not found.", code=ErrorCode.LOBBY_NOT_FOUND)

    return lobby


def close_lobby(db: Session, user: User, lobby_id: int) -> None:
    lobby = get_lobby_or_404(db, lobby_id)

    member = get_member(db, lobby_id, user.id)

    if member is None or member.role != HOST:
        raise forbidden("Only the host can close this lobby.", code=ErrorCode.NOT_LOBBY_HOST)

    db.delete(lobby)
    db.commit()


def leave_lobby(db: Session, user: User, lobby_id: int) -> None:
    get_lobby_or_404(db, lobby_id)

    member = get_member(db, lobby_id, user.id)

    if member is None:
        raise forbidden("You are not a member of this lobby.", code=ErrorCode.NOT_LOBBY_MEMBER)

    # The host leaving ends the lobby for everyone rather than leaving it
    # ownerless; guests are expected to use this path, hosts "close" instead,
    # but this keeps the endpoint correct either way.
    if member.role == HOST:
        db.delete(member.lobby)
        db.commit()
        return

    db.delete(member)
    db.commit()


def require_lobby_member(db: Session, lobby_id: int, user_id: int) -> LobbyMember:
    get_lobby_or_404(db, lobby_id)

    member = get_member(db, lobby_id, user_id)

    if member is None:
        raise forbidden("You are not a member of this lobby.", code=ErrorCode.NOT_LOBBY_MEMBER)

    return member


def get_other_member_ids(db: Session, lobby_id: int, user_id: int) -> list[int]:
    return [
        member.user_id
        for member in db.query(LobbyMember).filter(LobbyMember.lobby_id == lobby_id).all()
        if member.user_id != user_id
    ]


def get_lobby_messages(db: Session, user: User, lobby_id: int) -> list[LobbyMessage]:
    require_lobby_member(db, lobby_id, user.id)

    return (
        db.query(LobbyMessage)
        .options(joinedload(LobbyMessage.sender))
        .filter(LobbyMessage.lobby_id == lobby_id)
        .order_by(LobbyMessage.created_at.desc(), LobbyMessage.id.desc())
        .limit(MAX_MESSAGE_HISTORY)
        .all()
    )[::-1]


def send_lobby_message(db: Session, user: User, lobby_id: int, content: str) -> LobbyMessage:
    require_lobby_member(db, lobby_id, user.id)

    message = LobbyMessage(
        lobby_id=lobby_id,
        # Set via the relationship (not sender_id=user.id) so message.sender
        # is already populated from the User we have in memory, instead of
        # a lazy-loaded query when the response/notification serialize it.
        sender=user,
        content=content,
    )

    db.add(message)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        # Most likely cause: the lobby was closed between the membership
        # check above and this commit, so the FK to lobby_id no longer
        # resolves -- report that specifically (raises LOBBY_NOT_FOUND).
        get_lobby_or_404(db, lobby_id)

        # The lobby still exists, so it wasn't that -- an unexpected
        # constraint failure with no more specific code to report.
        raise conflict("Could not send message.", code=ErrorCode.LOBBY_MESSAGE_SEND_FAILED)

    db.refresh(message)

    return message


def _check_invite_cooldown(user_id: int, friend_id: int) -> None:
    # Keyed by the inviter (not the lobby) so cycling through fresh lobbies
    # can't be used to bypass the cooldown for the same sender/friend pair.
    # Check-then-set happens under the lock so two concurrent requests for
    # the same pair can't both observe "not on cooldown" before either
    # records it -- route handlers are sync `def`s, so this really can race
    # across threadpool threads.
    now = utc_now()
    key = (user_id, friend_id)

    with _recent_invites_lock:
        # Opportunistic cleanup so this dict doesn't grow unboundedly. Uses
        # pop(..., None) instead of del since the lock makes a genuine
        # double-delete impossible anyway, but pop stays safe either way.
        for stale_key, sent_at in list(_recent_invites.items()):
            if now - sent_at >= INVITE_COOLDOWN:
                _recent_invites.pop(stale_key, None)

        if key in _recent_invites:
            raise conflict("You already invited this friend recently.", code=ErrorCode.INVITE_ALREADY_SENT)

        _recent_invites[key] = now


def release_invite_cooldown(user_id: int, friend_id: int) -> None:
    # For any case where the cooldown was reserved by _check_invite_cooldown
    # but the invite didn't actually go anywhere -- a later check in this
    # function still failed, or delivery reached no one -- so the sender
    # isn't charged a real 30s retry window for a no-op.
    with _recent_invites_lock:
        _recent_invites.pop((user_id, friend_id), None)


def _check_invite_rate_limit(user_id: int) -> datetime:
    # Global per-sender throttle, independent of which friend is being
    # invited -- caps how many invites (to any mix of friends) a user can
    # send in a rolling window, since _check_invite_cooldown alone only
    # stops repeat invites to the *same* friend.
    now = utc_now()
    cutoff = now - INVITE_RATE_LIMIT_WINDOW

    with _recent_invites_lock:
        times = _invite_send_times.setdefault(user_id, [])

        while times and times[0] < cutoff:
            times.pop(0)

        if len(times) >= INVITE_RATE_LIMIT_MAX:
            raise conflict(
                "You're sending invites too quickly. Try again shortly.",
                code=ErrorCode.INVITE_RATE_LIMIT_EXCEEDED,
            )

        times.append(now)

    return now


def release_invite_rate_limit(user_id: int, sent_at: datetime) -> None:
    # Mirrors release_invite_cooldown: an invite reserved here but that
    # failed for some other reason (friendship not found, transient error)
    # shouldn't cost the sender a slot in their rate-limit window. Removes
    # the exact timestamp this call reserved rather than popping blindly, so
    # a concurrent invite from the same user in between isn't dropped.
    with _recent_invites_lock:
        times = _invite_send_times.get(user_id)

        if times:
            try:
                times.remove(sent_at)
            except ValueError:
                pass


def invite_friend_to_lobby(db: Session, user: User, lobby_id: int, friend_id: int) -> Lobby:
    lobby = get_lobby_or_404(db, lobby_id)

    # invite_friend_to_lobby never writes lobby membership itself -- it only
    # reads it to decide whether to send a notification -- so there's no
    # data-integrity invariant here for a row lock to protect; join_lobby
    # independently re-validates capacity under its own lock at the moment
    # someone actually joins.
    if get_member(db, lobby_id, user.id) is None:
        raise forbidden("You are not a member of this lobby.", code=ErrorCode.NOT_LOBBY_MEMBER)

    if friend_id == user.id:
        raise bad_request("You cannot invite yourself.", code=ErrorCode.CANNOT_INVITE_SELF)

    member_ids = {
        member_id
        for (member_id,) in db.query(LobbyMember.user_id).filter(LobbyMember.lobby_id == lobby_id).all()
    }

    if friend_id in member_ids:
        raise conflict("This friend is already in the lobby.", code=ErrorCode.ALREADY_LOBBY_MEMBER)

    if len(member_ids) >= MAX_MEMBERS:
        raise conflict("This lobby is full.", code=ErrorCode.LOBBY_FULL)

    # Free, in-memory checks -- run before the one remaining DB query so a
    # repeated/spam invite doesn't pay for a friendship lookup it can't use.
    _check_invite_cooldown(user.id, friend_id)
    rate_limit_sent_at = _check_invite_rate_limit(user.id)

    try:
        friendship = get_friendship(db, user.id, friend_id)
    except Exception:
        # Release on ANY failure here, not just a clean "not found" -- a
        # transient DB error shouldn't cost the sender a real retry window
        # for an invite that was never actually sent.
        release_invite_cooldown(user.id, friend_id)
        release_invite_rate_limit(user.id, rate_limit_sent_at)
        raise

    if friendship is None:
        release_invite_cooldown(user.id, friend_id)
        release_invite_rate_limit(user.id, rate_limit_sent_at)
        raise not_found("Friendship not found.", code=ErrorCode.FRIENDSHIP_NOT_FOUND)

    return lobby
