from fastapi import WebSocket, WebSocketDisconnect


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
        for websocket in list(self.active_connections.get(user_id, [])):
            try:
                await websocket.send_json(payload)
            except (WebSocketDisconnect, RuntimeError):
                self.disconnect(user_id, websocket)


connection_manager = ConnectionManager()
