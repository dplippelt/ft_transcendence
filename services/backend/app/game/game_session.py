import asyncio
import logging
from asyncio.exceptions import CancelledError
from enum import Enum, StrEnum, auto
from time import monotonic

from fastapi import WebSocket

from app.schemas.game import GameSnapshot, PlayerAction

from .game_simulation import GameSimulation
from .session_connection_manager import Connection, SessionConnectionManager

SESSION_TIMEOUT = 140.0

logger = logging.getLogger(__name__)


class SessionState(Enum):
    INITIALIZE = auto()
    WAITING_FOR_PLAYERS = auto()
    RUNNING = auto()
    SESSION_OVER = auto()


class JoinStatus(StrEnum):
    GAME_JOINED = "Game joined"
    GAME_FULL = "Game is full"
    GAME_NOT_JOINED = "Game not joined"
    GAME_NOT_FOUND = "Game not found"
    GAME_ALREADY_JOINED = "Game already joined"
    GAME_FAILED_TO_CONNECT = "Game failed to accept connection"


class GameSession:
    def __init__(
        self,
        id: str,
        allowed_user_list: set[int] | None = None,
    ):
        self.id: str = id
        self.connection_manager: SessionConnectionManager = SessionConnectionManager()
        self.allowed_user_list: set[int] | None = allowed_user_list
        self.game: GameSimulation = GameSimulation(self.id)
        self.state: SessionState = SessionState.INITIALIZE
        self.task: asyncio.Task[None] | None = None
        self.lock: asyncio.Lock = asyncio.Lock()
        self.time_since_last_action: float = monotonic()

    def start(self):
        if self.task:
            return

        self.task = asyncio.create_task(self.game_loop())
        self.task.add_done_callback(self.task_ended)
        self.state = SessionState.WAITING_FOR_PLAYERS

    async def stop(self):
        if self.task is None:
            return

        if self.task.cancel():
            try:
                await self.task
            except CancelledError:
                pass
        self.task = None

    def required_player_count(self):
        return 1 if self.allowed_user_list is None else len(self.allowed_user_list)

    # TODO: Support spectators
    async def join(self, user_id: int, socket: WebSocket) -> JoinStatus:
        if self.allowed_user_list is not None and user_id not in self.allowed_user_list:
            return JoinStatus.GAME_NOT_JOINED

        async with self.lock:
            is_connected: bool = await self.connection_manager.accept_connection(user_id, socket)
            if not is_connected:
                return JoinStatus.GAME_FAILED_TO_CONNECT

            self.game.connect_player(user_id)
            self.update_time_since_action(user_id)

            if (
                self.state is SessionState.WAITING_FOR_PLAYERS
                and self.connection_manager.count() == self.required_player_count()
            ):
                self.state = SessionState.RUNNING

        return JoinStatus.GAME_JOINED

    async def leave(self, user_id: int, websocket: WebSocket) -> None:
        async with self.lock:
            self.connection_manager.remove_connection(user_id, websocket)

            if not self.connection_manager.is_user_connected(user_id):
                self.game.disconnect_player(user_id)

            if self.connection_manager.is_empty():
                self.state = SessionState.WAITING_FOR_PLAYERS

    def websocket_connected(self, user_id: int, websocket: WebSocket) -> bool:
        return self.connection_manager.is_user_connected(user_id, websocket)

    async def broadcast(self) -> None:
        async with self.lock:
            connected_users = self.connection_manager.get_user_connections()

        failed_deliveries: list[Connection] = []
        for user in connected_users:
            delivered = await user.send_snapshot(self.game.get_snapshot(user.user_id))
            if not delivered:
                failed_deliveries.append(user)

        if not failed_deliveries:
            return

        async with self.lock:
            for user in failed_deliveries:
                await self.connection_manager.close_connection(
                    user.user_id, user.websocket
                )
                self.game.disconnect_player(user.user_id)

            if self.connection_manager.is_empty():
                self.state = SessionState.WAITING_FOR_PLAYERS

    async def check_user_activity(self):
        async with self.lock:
            timed_out_users = await self.connection_manager.time_out_inactive_users()
            for user_id in timed_out_users:
                self.game.disconnect_player(user_id)

            if self.connection_manager.is_empty():
                self.state = SessionState.WAITING_FOR_PLAYERS

    async def game_loop(self):
        FIXED_TIME_STEP: float = 1.0 / 20.0

        while True:
            start_time = monotonic()
            if self.is_over():
                break

            await self.check_user_activity()
            if self.state == SessionState.RUNNING:
                self.game.tick(FIXED_TIME_STEP)
                await self.broadcast()

            elapsed_time = monotonic() - start_time
            await asyncio.sleep(delay=max(0, FIXED_TIME_STEP - elapsed_time))

    def update_time_since_action(self, user_id: int):
        self.time_since_last_action = monotonic()
        self.connection_manager.update_last_seen_of_user(user_id)

    def enqueue_player_action(self, user_id: int, player_action: PlayerAction) -> None:
        self.update_time_since_action(user_id)
        self.game.enqueue_player_action(user_id, player_action)

    def get_snapshot(self, user_id: int) -> GameSnapshot:
        return self.game.get_snapshot(user_id)

    def task_ended(self, task: asyncio.Task[None]):
        try:
            task.result()
        except CancelledError:
            pass
        except Exception as ex:
            logger.exception(f"session {self.id} failed")

        self.state = SessionState.SESSION_OVER

    def is_over(self) -> bool:
        if (
            self.state == SessionState.WAITING_FOR_PLAYERS
            or self.state == SessionState.INITIALIZE
        ) and (monotonic() - self.time_since_last_action) > SESSION_TIMEOUT:
            return True

        return self.state == SessionState.SESSION_OVER
