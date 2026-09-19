import asyncio
from dataclasses import dataclass
from time import monotonic

from fastapi import WebSocket, status

from app.schemas.game import GameSnapshot

CLIENT_TIMEOUT = 10.0
MAX_PLAYERS = 2
EMPTY_SESSION = 0
SEND_TIMEOUT = 0.1


@dataclass
class Connection:
    user_id: int
    websocket: WebSocket
    last_seen: float

    def is_timed_out(self):
        return monotonic() - self.last_seen > CLIENT_TIMEOUT

    def update_last_seen(self):
        self.last_seen = monotonic()

    async def send_snapshot(self, snapshot: GameSnapshot) -> bool:
        try:
            await asyncio.wait_for(
                self.websocket.send_json(snapshot.model_dump(mode="json")),
                timeout=SEND_TIMEOUT,
            )
        except Exception:
            return False
        return True

    def __eq__(self, other: object) -> bool:
        if isinstance(other, Connection):
            return self.websocket == other.websocket
        return self.websocket == other


class SessionConnectionManager:
    def __init__(self):
        self.connections: dict[int, Connection] = {}

    async def accept_connection(self, user_id: int, websocket: WebSocket):
        previous = self.connections.get(user_id)

        await websocket.accept()
        self.connections[user_id] = Connection(user_id, websocket, monotonic())

        if previous is None:
            return

        try:  # TODO: What code should be sent?
            await previous.websocket.close(
                code=status.WS_1000_NORMAL_CLOSURE, reason="new connection is made"
            )
        except Exception:
            pass

    def remove_connection(self, user_id: int, websocket: WebSocket) -> None:
        if not self.is_user_connected(user_id, websocket):
            return
        del self.connections[user_id]

    async def close_connection(
        self, user_id: int, websocket: WebSocket | None = None
    ) -> None:
        if not user_id in self.connections:
            return

        user_websocket = self.connections[user_id].websocket
        if websocket is not None and websocket is not user_websocket:
            return

        try:
            await user_websocket.close(
                code=status.WS_1001_GOING_AWAY, reason="connection time out"
            )
        except Exception:
            pass

        del self.connections[user_id]

    def get_user_connections(self) -> list[Connection]:
        return list(self.connections.values())

    def is_user_connected(
        self, user_id: int, websocket: WebSocket | None = None
    ) -> bool:
        if user_id in self.connections:
            return websocket is None or self.connections[user_id].websocket == websocket

        return False

    def update_last_seen_of_user(self, user_id: int) -> None:
        if not user_id in self.connections:
            return
        self.connections[user_id].update_last_seen()

    async def time_out_inactive_users(self) -> list[int]:
        timed_out_users = []
        user_ids = list(self.connections.keys())
        for user_id in user_ids:
            if self.connections[user_id].is_timed_out():
                await self.close_connection(user_id)
                timed_out_users.append(user_id)

        return timed_out_users

    def is_full(self) -> bool:
        return len(self.connections) == MAX_PLAYERS

    def is_empty(self) -> bool:
        return len(self.connections) == EMPTY_SESSION
