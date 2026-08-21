import logging

from fastapi import APIRouter, status
from sqlalchemy.orm import Session

from app.api.dependencies import CompletedUser, DbSession
from app.core.exceptions import ErrorCode, not_found
from app.core.websocket_manager import connection_manager
from app.models.lobby import Lobby
from app.models.user import User
from app.schemas.lobby import (
    LobbyCreate,
    LobbyInviteCreate,
    LobbyInviteResponse,
    LobbyMessageCreate,
    LobbyMessageResponse,
    LobbyResponse,
)
from app.schemas.user import PublicUserResponse
from app.services.lobby_service import (
    close_lobby,
    create_lobby,
    get_lobby_by_id,
    get_lobby_messages,
    get_other_member_ids,
    invite_friend_to_lobby,
    join_lobby,
    leave_lobby,
    list_lobbies,
    send_lobby_message,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def notify_other_members(db: Session, lobby_id: int, sender_id: int, message: object) -> None:
    # Best-effort: the message is already persisted, so a delivery failure
    # here must not turn a successful send into a 500 -- covers building the
    # payload and looking up recipients too, not just the socket send.
    # Reuses the same per-user connection registry chat.py's websocket
    # populates -- lobby members don't need a second websocket connection.
    try:
        payload = {
            "type": "lobby_message",
            **LobbyMessageResponse.model_validate(message).model_dump(mode="json"),
        }
        member_ids = get_other_member_ids(db, lobby_id, sender_id)
    except Exception:
        logger.warning("Failed to prepare lobby message notification for lobby %s", lobby_id, exc_info=True)
        return

    for member_id in member_ids:
        connection_manager.notify(member_id, payload)


def notify_invite(friend_id: int, lobby: Lobby, inviter: User) -> bool:
    # No persisted model: an invite is just a real-time nudge, not a new
    # access grant -- the invited friend can already see and join any
    # public lobby via GET /lobbies + POST /lobbies/{id}/join regardless.
    # Still reports whether it actually reached a connection, so the
    # caller can tell "delivered" apart from "friend wasn't online" --
    # the only signal that would otherwise exist for either case.
    return connection_manager.notify_safely(
        friend_id,
        "lobby_invite",
        lambda: {
            "lobby_id": lobby.id,
            "lobby_name": lobby.name,
            "inviter": PublicUserResponse.model_validate(inviter).model_dump(mode="json"),
        },
    )


@router.get("", response_model=list[LobbyResponse])
def get_lobbies(current_user: CompletedUser, db: DbSession):
    return list_lobbies(db)


@router.post("", response_model=LobbyResponse, status_code=status.HTTP_201_CREATED)
def post_lobby(lobby_data: LobbyCreate, current_user: CompletedUser, db: DbSession):
    return create_lobby(db, current_user, lobby_data.name)


@router.get("/{lobby_id}", response_model=LobbyResponse)
def get_lobby(lobby_id: int, current_user: CompletedUser, db: DbSession):
    lobby = get_lobby_by_id(db, lobby_id)

    if lobby is None:
        raise not_found("Lobby not found", code=ErrorCode.LOBBY_NOT_FOUND)

    return lobby


@router.post("/{lobby_id}/join", response_model=LobbyResponse)
def join(lobby_id: int, current_user: CompletedUser, db: DbSession):
    return join_lobby(db, current_user, lobby_id)


@router.post("/{lobby_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
def leave(lobby_id: int, current_user: CompletedUser, db: DbSession):
    leave_lobby(db, current_user, lobby_id)

    return None


@router.delete("/{lobby_id}", status_code=status.HTTP_204_NO_CONTENT)
def close(lobby_id: int, current_user: CompletedUser, db: DbSession):
    close_lobby(db, current_user, lobby_id)

    return None


@router.get("/{lobby_id}/messages", response_model=list[LobbyMessageResponse])
def get_messages(lobby_id: int, current_user: CompletedUser, db: DbSession):
    return get_lobby_messages(db, current_user, lobby_id)


@router.post("/{lobby_id}/messages", response_model=LobbyMessageResponse, status_code=status.HTTP_201_CREATED)
def post_message(lobby_id: int, message_data: LobbyMessageCreate, current_user: CompletedUser, db: DbSession):
    message = send_lobby_message(db, current_user, lobby_id, message_data.content)

    notify_other_members(db, lobby_id, current_user.id, message)

    return message


@router.post("/{lobby_id}/invite", response_model=LobbyInviteResponse)
def invite(lobby_id: int, invite_data: LobbyInviteCreate, current_user: CompletedUser, db: DbSession):
    lobby = invite_friend_to_lobby(db, current_user, lobby_id, invite_data.friend_id)

    delivered = notify_invite(invite_data.friend_id, lobby, current_user)

    return LobbyInviteResponse(delivered=delivered)
