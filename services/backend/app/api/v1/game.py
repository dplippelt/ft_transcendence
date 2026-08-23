import logging

from fastapi import APIRouter, WebSocket, status
from fastapi._compat.v2 import ValidationError

from app.api.dependencies import CurrentUserIdWS
from app.game.game_session import JoinStatus
from app.game.game_session_manager import game_session_manager
from app.schemas.game import PlayerAction

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/game/{game_session_id}")
async def game_websocket(
    websocket: WebSocket, game_session_id: int, current_user_id: CurrentUserIdWS
):
    joined, game_session = await game_session_manager.join_session(
        game_session_id, current_user_id, websocket
    )
    if joined is not JoinStatus.GAME_JOINED or game_session is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason=joined.value)
        return

    await websocket.send_json(
        current_user_id, game_session.get_json_snapshot(current_user_id)
    )

    try:
        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.disconnect":
                break

            try:
                player_action = PlayerAction.model_validate(message)
                game_session.enqueue_player_action(current_user_id, player_action)
            except ValidationError:
                logger.warning("Invalid player action received!")
    finally:
        game_session.leave(current_user_id)
