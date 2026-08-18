from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import ErrorCode, conflict, forbidden, not_found
from app.db.utils import commit_or_bad_request
from app.models.lobby import Lobby
from app.models.lobby_member import LobbyMember
from app.models.user import User

HOST = "host"
GUEST = "guest"
MAX_MEMBERS = 2


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


def close_lobby(db: Session, user: User, lobby_id: int) -> None:
    lobby = db.query(Lobby).filter(Lobby.id == lobby_id).first()

    if lobby is None:
        raise not_found("Lobby not found.", code=ErrorCode.LOBBY_NOT_FOUND)

    member = get_member(db, lobby_id, user.id)

    if member is None or member.role != HOST:
        raise forbidden("Only the host can close this lobby.", code=ErrorCode.NOT_LOBBY_HOST)

    db.delete(lobby)
    db.commit()


def leave_lobby(db: Session, user: User, lobby_id: int) -> None:
    member = get_member(db, lobby_id, user.id)

    if member is None:
        raise not_found("You are not a member of this lobby.", code=ErrorCode.LOBBY_NOT_FOUND)

    # The host leaving ends the lobby for everyone rather than leaving it
    # ownerless; guests are expected to use this path, hosts "close" instead,
    # but this keeps the endpoint correct either way.
    if member.role == HOST:
        db.delete(member.lobby)
        db.commit()
        return

    db.delete(member)
    db.commit()
