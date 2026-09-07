import asyncio
from asyncio.exceptions import CancelledError
import logging
from enum import Enum, StrEnum, auto
from time import monotonic

from fastapi import WebSocket

from app.core.websocket_manager import ConnectionManager
from app.schemas.game import GameSnapshot, PlayerAction

from .game_simulation import GameSimulation

SESSION_TIMEOUT = 140.0
CLIENT_TIMEOUT = 10.0
MAX_PLAYERS = 2

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


class GameSession:
    def __init__(
        self,
        id: str,
        connection_manager: ConnectionManager,
        allowed_user_list: set[int] | None = None,
    ):
        self.id: str = id
        self.connection_manager: ConnectionManager = connection_manager
        self.allowed_user_list: set[int] | None = allowed_user_list
        self.game: GameSimulation = GameSimulation(self.id)
        self.state: SessionState = SessionState.INITIALIZE
        self.connected_users: set[int] = set()
        self.task: asyncio.Task[None] | None = None
        self.lock: asyncio.Lock = asyncio.Lock()
        self.time_since_last_action: float = monotonic()
        self.time_last_player_action: dict[int, float] = {}

    def start(self) -> bool:
        if self.task:
            return True

        self.task = asyncio.create_task(self.game_loop())
        self.task.add_done_callback(self.task_ended)
        self.state = SessionState.WAITING_FOR_PLAYERS
        return True

    async def stop(self):
        if self.task is None:
            return

        if self.task.cancel():
            try:
                await self.task
            except CancelledError:
                pass
        self.task = None

    # TODO: Support spectators
    async def join(self, user_id: int, socket: WebSocket) -> JoinStatus:
        if self.allowed_user_list is not None and user_id not in self.allowed_user_list:
            return JoinStatus.GAME_NOT_JOINED

        async with self.lock:
            if user_id in self.connected_users:
                await self.connection_manager.connect(user_id, socket)
                self.update_time_since_action(user_id)
                return JoinStatus.GAME_JOINED

            if len(self.connected_users) == MAX_PLAYERS:
                return JoinStatus.GAME_FULL

            await self.connection_manager.connect(user_id, socket)
            self.connected_users.add(user_id)
            self.game.connect_player(user_id)
            self.update_time_since_action(user_id)

            if len(self.connected_users) == MAX_PLAYERS:
                self.state = SessionState.RUNNING

        return JoinStatus.GAME_JOINED

    def disconnect_user(self, user_id: int):
        self.connection_manager.disconnect_user(user_id)
        self.connected_users.remove(user_id)
        self.game.disconnect_player(user_id)

    async def leave(self, user_id: int) -> None:
        async with self.lock:
            if user_id not in self.connected_users:
                return

            self.disconnect_user(user_id)

            if not self.connected_users:
                self.state = SessionState.WAITING_FOR_PLAYERS

    async def broadcast(self) -> None:
        async with self.lock:
            connected_users = list(self.connected_users)

        for user_id in connected_users:
            await self.connection_manager.send_to_user(
                user_id, self.game.get_snapshot(user_id).model_dump(mode="json")
            )

    async def check_user_activity(self):
        async with self.lock:
            current_time = monotonic()
            for user_id in list(self.connected_users):
                if user_id in self.time_last_player_action and (
                    current_time - self.time_last_player_action[user_id] > CLIENT_TIMEOUT
                ):
                    self.disconnect_user(user_id)

            if not self.connected_users:
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
        self.time_last_player_action[user_id] = monotonic()

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

        if self.task is None or self.task.exception():
            return True

        return self.state == SessionState.SESSION_OVER
