from collections import deque
from random import getrandbits

from app.schemas.game import (
    Enemy,
    GameSnapshot,
    GameState,
    Player,
    PlayerAction,
    PlayerState,
)


class GameSimulation:
    def __init__(self, game_id: str):
        self.game_id: str = game_id
        self.tick_id: int = 0
        self.dungeon_seed: int = getrandbits(32)
        self.game_state: GameState = GameState.PAUSED
        self.players: dict[int, Player] = {}
        self.enemies: list[Enemy] = []
        self.player_actions: dict[int, deque[PlayerAction]] = {}
        self._last_player_id: int = -1

    def next_player_id(self):
        self._last_player_id += 1
        return self._last_player_id

    def tick(self, deltaTime: float) -> None:
        pass  # TODO: Game logic here (Next PR)

    def create_player(self) -> Player:  # spawn player object at spawnpoint
        return Player(
            x=0,  # TODO: should be spawn point
            y=0,  # TODO: should be spawn point
            player_id=self.next_player_id(),
            sequence=0,
            state=PlayerState.ALIVE | PlayerState.CONNECTED,
            hp=10,
            mp=10,
        )

    def connect_player(self, user_id: int):
        if user_id not in self.players:
            self.players[user_id] = self.create_player()

        self.players[user_id].state |= PlayerState.CONNECTED

    def disconnect_player(self, user_id: int) -> None:
        if user_id not in self.players:
            return
        self.players[user_id].state &= ~PlayerState.CONNECTED

    def enqueue_player_action(self, user_id: int, player_action: PlayerAction):
        assert user_id in self.players, f"user {user_id} not listed"
        user_player = self.players[user_id]

        # player action sequence continues from the last processed action and is not too far in the future
        if (
            user_player.sequence > player_action.sequence
            or user_player.sequence + 128 < player_action.sequence
        ):
            return

        player_actions = self.player_actions.setdefault(user_id, deque())

        # the player queue is not full and remains in order
        if player_actions and (
            len(player_actions) > 32
            or player_actions[-1].sequence < player_action.sequence
        ):
            return

        player_actions.append(player_action)

    def get_snapshot(self, user_id: int) -> GameSnapshot:
        assert user_id in self.players, "user not connected as player"

        return GameSnapshot(
            type="game.snapshot",
            game_id=self.game_id,
            tick_id=self.tick_id,
            state=self.game_state,
            dungeon_seed=self.dungeon_seed,
            user_player_id=self.players[user_id].player_id,
            players=list(self.players.values()),
            enemies=self.enemies,
            combat=[],  # TODO: Combat data required
        )
