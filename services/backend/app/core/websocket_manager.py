import logging

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    # In-process only: connections live in this worker's memory, so a user
    # connected to a different worker/instance won't receive a push sent
    # from here. Fine for a single-process deployment; a multi-worker or
    # multi-instance setup would need a shared pub/sub layer (e.g. Redis)
    # instead.
    def __init__(self) -> None:
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.setdefault(user_id, []).append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        connections = self.active_connections.get(user_id)

        if not connections:
            return

        if websocket in connections:
            connections.remove(websocket)

        if not connections:
            self.active_connections.pop(user_id, None)

    async def send_to_user(self, user_id: int, payload: dict) -> None:
        # Catch broadly per-socket: one dead/broken connection must not stop
        # delivery to this user's other open tabs/devices.
        for websocket in list(self.active_connections.get(user_id, [])):
            try:
                await websocket.send_json(payload)
            except Exception:
                logger.warning("Failed to push message to user %s over websocket", user_id, exc_info=True)
                self.disconnect(user_id, websocket)


connection_manager = ConnectionManager()
