import asyncio
from enum import Enum, StrEnum, auto
from random import getrandbits
from time import monotonic

from app.core.websocket_manager import ConnectionManager
from app.schemas.game import PlayerAction

from .game_simulation import GameSimulation

# Session state (Initialize Session -> Waiting For Players -> Running -> Session Over)
# Session state: Running -> all players left -> Session Over
# Session state: Running -> GS Game Over -> Session Over
#
# Game State: Running -> Level Complete -> Next Level
# Game State: Running -> All lifes lost -> Game Over (Lose)
# Game State: Running -> All levels complete -> Game Over (Win)
#
# Player state, Alive, InCombat, Dead, Disconnected
# Enemy state Idle, Wander, Chase, Combat, Recall
#
# Player entities: user_id/player_id, player state
# Dynamic enities: xy, tileXY, movement speed, body size, is alive, in combat
# Map: 2D tile map; tile size
#
# clients need to know; dungeon_seed and tile size
# 64px per tile


# GameSessionManager and its responsibilities
# GameSession and its responsibilities
# Allow Players to join a game Session !
#
# Translate the map generation code into python


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


# TODO: async start game loop
class GameSession:
    def __init__(
        self,
        id: int,
        connection_manager: ConnectionManager,
        allowed_user_list: set[int] | None = None,
    ):
        self.id: int = id
        self.dungeon_seed: int = getrandbits(32)
        self.state: SessionState = SessionState.INITIALIZE
        self.game: GameSimulation = GameSimulation()
        self.connection_manager: ConnectionManager = connection_manager
        self.allowed_user_list: set[int] | None = allowed_user_list
        self.connected_users: set[int] = set()

    def join_session(self, user_id: int) -> JoinStatus:
        if self.allowed_user_list is not None and user_id not in self.allowed_user_list:
            return JoinStatus.GAME_NOT_JOINED

        if user_id in self.connected_users:
            return JoinStatus.GAME_JOINED

        # TODO: Support spectators
        if len(self.connected_users) == 2:
            return JoinStatus.GAME_FULL

        self.connected_users.add(user_id)
        self.game.connect_player(user_id)
        # TODO: all players joined? change state to running

        return JoinStatus.GAME_JOINED

    def leave_session(self, user_id: int) -> None:
        if user_id not in self.connected_users:
            return

        self.connected_users.remove(user_id)
        self.game.disconnect_player(user_id)

        if not self.connected_users:
            self.state = SessionState.SESSION_OVER

    async def broadcast(self) -> None:
        for user_id in self.connected_users:
            await self.connection_manager.send_to_user(
                user_id, self.game.get_snapshot()
            )

    async def game_loop(self) -> None:
        FIXED_TIME_STEP: float = 1.0 / 20.0

        while self.state == SessionState.RUNNING:
            start_time = monotonic()
            self.game.tick(FIXED_TIME_STEP)
            await self.broadcast()

            elapsed_time = monotonic() - start_time
            await asyncio.sleep(delay=max(0, FIXED_TIME_STEP - elapsed_time))

    def queue_player_action(self, user_id: int, player_action: PlayerAction) -> None:
        pass

    def get_json_snapshot(self) -> str:
        return self.game.get_snapshot().model_dump_json()

    def is_session_over(self) -> bool:
        return self.state == SessionState.SESSION_OVER
