import asyncio
import uuid

from fastapi import WebSocket

from app.core.websocket_manager import ConnectionManager

from .game_session import GameSession, JoinStatus


class GameSessionManager:
    def __init__(self):
        self.game_sessions: dict[int, GameSession] = {}
        self.task: asyncio.Task[None] = asyncio.create_task(
            self.validate_session_state()
        )

    def create(self) -> GameSession:
        session_id = uuid.uuid4()
        game_session = GameSession(session_id.int, ConnectionManager())

        self.game_sessions[session_id.int] = game_session
        return game_session

    async def join_session(
        self, session_id: int, user_id: int, socket: WebSocket
    ) -> tuple[JoinStatus, GameSession | None]:
        game_session = self.game_sessions.get(session_id)
        if game_session is None:
            return (JoinStatus.GAME_NOT_FOUND, None)

        join_status = await game_session.join(user_id, socket)
        return (join_status, game_session)

    async def validate_session_state(self) -> None:
        while True:
            for session in list(self.game_sessions.values()):
                if session.is_over():
                    self.remove_session(session.id)
            await asyncio.sleep(delay=10)

    def remove_session(self, session_id: int) -> None:
        if session_id in self.game_sessions:
            del self.game_sessions[session_id]


# TODO: Lifespan object instead?
game_session_manager = GameSessionManager()
