from fastapi import APIRouter, status

from app.api.dependencies import CompletedUser, DbSession
from app.core.exceptions import ErrorCode, not_found
from app.schemas.lobby import LobbyCreate, LobbyResponse
from app.services.lobby_service import (
    close_lobby,
    create_lobby,
    get_lobby_by_id,
    join_lobby,
    leave_lobby,
    list_lobbies,
)

router = APIRouter()


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
