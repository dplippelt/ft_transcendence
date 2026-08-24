import asyncio
from enum import Enum, StrEnum, auto
from time import monotonic

from fastapi import WebSocket

from app.core.websocket_manager import ConnectionManager
from app.schemas.game import GameSnapshot, PlayerAction

from .game_simulation import GameSimulation

SESSION_TIMEOUT = 140.0
CLIENT_TIMEOUT = 10.0


class SessionState(Enum):
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
        self.state: SessionState = SessionState.WAITING_FOR_PLAYERS
        self.connected_users: set[int] = set()
        self.task: asyncio.Task[None] = asyncio.create_task(self.game_loop())
        self.time_since_last_action: float = monotonic()
        self.time_last_player_action: dict[int, float] = {}

    # TODO: Support spectators
    async def join(self, user_id: int, socket: WebSocket) -> JoinStatus:
        if self.allowed_user_list is not None and user_id not in self.allowed_user_list:
            return JoinStatus.GAME_NOT_JOINED

        if user_id in self.connected_users:
            await self.connection_manager.connect(user_id, socket)
            return JoinStatus.GAME_JOINED

        if len(self.connected_users) == 2:
            return JoinStatus.GAME_FULL

        await self.connection_manager.connect(user_id, socket)
        self.connected_users.add(user_id)
        self.game.connect_player(user_id)

        if len(self.connected_users) == 2:
            self.state = SessionState.RUNNING

        return JoinStatus.GAME_JOINED

    def leave(self, user_id: int) -> None:
        if user_id not in self.connected_users:
            return

        self.connection_manager.disconnect_user(user_id)
        self.connected_users.remove(user_id)
        self.game.disconnect_player(user_id)

        if not self.connected_users:
            self.state = SessionState.WAITING_FOR_PLAYERS

    async def broadcast(self) -> None:
        for user_id in self.connected_users:
            await self.connection_manager.send_to_user(
                user_id, self.game.get_snapshot(user_id).model_dump(mode="json")
            )

    def check_user_activity(self):
        current_time = monotonic()
        for user_id in self.connected_users:
            if user_id in self.time_last_player_action and (
                current_time - self.time_last_player_action[user_id] > CLIENT_TIMEOUT
            ):
                self.leave(user_id)

        if not self.connected_users:
            self.state = SessionState.WAITING_FOR_PLAYERS

    async def game_loop(self):
        FIXED_TIME_STEP: float = 1.0 / 20.0

        while True:
            start_time = monotonic()
            if self.is_over():
                break

            self.check_user_activity()
            if self.state == SessionState.RUNNING:
                self.game.tick(FIXED_TIME_STEP)
                await self.broadcast()

            elapsed_time = monotonic() - start_time
            await asyncio.sleep(delay=max(0, FIXED_TIME_STEP - elapsed_time))

    def enqueue_player_action(self, user_id: int, player_action: PlayerAction) -> None:
        self.time_since_last_action = monotonic()
        self.time_last_player_action[user_id] = monotonic()
        self.game.enqueue_player_action(user_id, player_action)

    def get_snapshot(self, user_id: int) -> GameSnapshot:
        return self.game.get_snapshot(user_id)

    def is_over(self) -> bool:
        if (
            self.state == SessionState.WAITING_FOR_PLAYERS
            and (monotonic() - self.time_since_last_action) > SESSION_TIMEOUT
        ):
            return True

        return self.state == SessionState.SESSION_OVER
