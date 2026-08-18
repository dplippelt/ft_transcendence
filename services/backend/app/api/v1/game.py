import logging

from fastapi import APIRouter, WebSocket, status
from fastapi._compat.v2 import ValidationError

from app.api.dependencies import CurrentUserIdWS
from app.core.websocket_manager import connection_manager
from app.game.game_session import JoinStatus
from app.game.game_session_manager import game_session_manager
from app.schemas.game import PlayerAction

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/game/{game_session_id}")
async def game_websocket(
    websocket: WebSocket, game_session_id: int, current_user_id: CurrentUserIdWS
):
    joined, game_session = game_session_manager.join_session(
        game_session_id, current_user_id
    )
    if joined is not JoinStatus.GAME_JOINED or game_session is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason=joined.value)
        return

    await connection_manager.connect(current_user_id, websocket)
    await websocket.send_json(current_user_id, game_session.get_json_snapshot())
    # TODO: user needs to know which player_id is theirs
    # TODO: session broadcast to other players that a player joined?

    try:
        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.disconnect":
                break
            try:
                player_action = PlayerAction.model_validate(message)
                game_session.queue_player_action(current_user_id, player_action)
            except ValidationError:
                pass
    finally:
        game_session.leave_session(current_user_id)
        connection_manager.disconnect(current_user_id, websocket)
