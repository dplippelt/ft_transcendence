from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import ErrorCode, conflict, forbidden, not_found
from app.db.utils import commit_or_bad_request
from app.models.lobby import Lobby
from app.models.lobby_member import LobbyMember
from app.models.lobby_message import LobbyMessage
from app.models.user import User

HOST = "host"
GUEST = "guest"
MAX_MEMBERS = 2
MAX_MESSAGE_HISTORY = 200


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
        raise conflict("Could not send message.")

    db.refresh(message)

    return message
