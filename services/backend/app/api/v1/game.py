import logging

from fastapi import APIRouter, WebSocket, status
from fastapi._compat.v2 import ValidationError

from app.api.dependencies import CurrentUserIdWS
from app.game.game_session import JoinStatus
from app.game.game_session_manager import game_session_manager
from app.schemas.game import ActionType, NewGameSession, Player, PlayerAction

logger = logging.getLogger(__name__)

router = APIRouter()


# TODO: temp route for creating and listing game sessions
@router.post(
    "/create", response_model=NewGameSession, status_code=status.HTTP_201_CREATED
)
async def create_game_session():
    game_session = game_session_manager.create()
    return NewGameSession(type="game.game-session", game_id=game_session.id)


@router.get("/list", response_model=list[NewGameSession])
async def list_game_sessions():
    live_game_sessions = [
        NewGameSession(type="game.game-session", game_id=session.id)
        for session in game_session_manager.game_sessions.values()
    ]
    return live_game_sessions


@router.websocket("/ws/join/{game_session_id}")
async def game_websocket(
    websocket: WebSocket,
    game_session_id: str,  # , current_user_id: CurrentUserIdWS
):
    current_user_id = 0
    joined, game_session = await game_session_manager.join_session(
        game_session_id, current_user_id, websocket
    )
    if joined is not JoinStatus.GAME_JOINED or game_session is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason=joined.value)
        return

    await websocket.send_json(game_session.get_snapshot(current_user_id).model_dump())

    try:
        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.disconnect":
                break;

            if message.get("text") is None:
                continue

            try:
                player_action = PlayerAction.model_validate_json(message["text"])
                game_session.enqueue_player_action(current_user_id, player_action)

                logger.debug(f"player {current_user_id} action: {player_action}")
            except ValidationError:
                logger.warning(f"Invalid player action received! {message}")
    finally:
        logger.debug(f"player {current_user_id} disconnected from the session {game_session.id}")
        game_session.leave(current_user_id)
