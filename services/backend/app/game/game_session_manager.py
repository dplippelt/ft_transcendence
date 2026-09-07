import logging
import asyncio
from asyncio.exceptions import CancelledError
import uuid

from fastapi import WebSocket

from app.core.websocket_manager import ConnectionManager

from .game_session import GameSession, JoinStatus


logger = logging.getLogger(__name__)

class GameSessionManager:
    def __init__(self):
        self.game_sessions: dict[str, GameSession] = {}
        self.task: asyncio.Task[None] | None = None

    def task_ended(self, task: asyncio.Task[None]):
        try:
            task.result()
        except CancelledError:
            pass
        except Exception:
            logger.exception("game session manager task failed")

    def start(self):
        if self.task:
            return

        self.task = asyncio.create_task(self.validate_session_state())
        self.task.add_done_callback(self.task_ended)

    async def stop(self):
        if self.task is None:
            return

        if self.task.cancel():
            try:
                await self.task
            except CancelledError:
                pass
        self.task = None

        for game_session in self.game_sessions.values():
            await game_session.stop()
        self.game_sessions.clear()

    def create(self, allowed_user_list: set[int] | None) -> GameSession | None:
        session_id = uuid.uuid4()
        game_session = GameSession(str(session_id.int), ConnectionManager(), allowed_user_list)
        if game_session.start():
            self.game_sessions[str(session_id.int)] = game_session
            return game_session
        return None

    async def join_session(
        self, session_id: str, user_id: int, socket: WebSocket
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
                    await self.remove_session(session.id)
            await asyncio.sleep(delay=10)

    async def remove_session(self, session_id: str) -> None:
        if session_id in self.game_sessions:
            await self.game_sessions[session_id].stop()
            del self.game_sessions[session_id]


game_session_manager = GameSessionManager()
