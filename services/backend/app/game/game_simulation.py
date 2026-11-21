from collections import deque
from random import getrandbits
from uuid import uuid4

from app.game.combat.card_deck import Operator
from app.game.combat.combat_manager import CombatManager, EnemyLevel
from app.schemas.combat import CombatPlayerStatus, CombatResult
from app.schemas.game import (
    Action,
    ActionType,
    Enemy,
    GameSnapshot,
    GameState,
    Player,
    PlayerAction,
    PlayerState,
)

# Combat starts as soon as a player joins, until combat can start from collisions.
DEBUG_AUTO_COMBAT = True # TODO: remove when the dungeon / enemies are in the game loop

# Keep a finished combat in the snapshot for a while, so the client sees combat_end.
from app.game.combat.combat_manager import TICKS_PER_SECOND

FINISHED_COMBAT_TICKS = 3 * TICKS_PER_SECOND


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
        self.combats: dict[int, CombatManager] = {} # key: user_id
        self._combat_finished_at: dict[int, int] = {}

    def next_player_id(self):
        self._last_player_id += 1
        return self._last_player_id

    def tick(self, deltaTime: float) -> None:
        self.tick_id += 1

        # 1. one action per player per tick
        for user_id, player in self.players.items():
            queue = self.player_actions.get(user_id)
            if not queue:
                continue
            player_action = queue.popleft()
            self._apply_action(user_id, player_action.action)
            player.sequence = player_action.sequence

        # 2. TODO (Jose: movement, enemies, collisions -> start combats)


        if DEBUG_AUTO_COMBAT:
            for user_id, player in self.players.items():
                if (
                    user_id not in self.combats 
                    and player.state & PlayerState.CONNECTED
                    and player.state & PlayerState.ALIVE
                ):
                    self._start_combat(user_id)

        # 3. time-driven
        for combat in self.combats.values():
            combat.update(self.tick_id)

        # 4. finished combats: copy hp/mp back, remove after a grace period
        self._clean_up_combats()


    def _apply_action(self, user_id: int, action: Action):
        combat = self.combats.get(user_id)
        match action.type:
            case ActionType.PLAY_CARDS if combat:
                combat.play_cards(action.cards, self.tick_id)
            case ActionType.DRAW_CARD if combat:
                combat.redraw(self.tick_id)
            # case ActionType.MOVE:
            # case ActionType.LEAVE:
            case _:
                pass

    def _start_combat(self, user_id: int) -> None:
        player = self.players[user_id]
        combat = CombatManager(
            combat_id=str(uuid4()),
            player_id=player.player_id,
            enemy_id=1, # TODO (Jose): the enemy the player collide with
            player=CombatPlayerStatus(hp=player.hp, max_hp=player.hp, mp=player.mp),
            enemy=EnemyLevel.NORMAL.value, #TODO should be from the enemy's level
            operators=list(Operator), #TODO should be the operators chosen in the lobby(ops mask)
        )
        combat.start(self.tick_id)
        self.combats[user_id] = combat
        player.state |= PlayerState.IN_COMBAT

    def _clean_up_combats(self) -> None:
        for user_id, combat in self.combats.items():
            if not combat.is_over():
                continue

            finished_at = self._combat_finished_at.get(user_id)
            if finished_at is None:
                # First tick after the end: apply the result to the player right away
                self._combat_finished_at[user_id] = self.tick_id
                self._finish_combat(user_id, combat)
            elif self.tick_id - finished_at >= FINISHED_COMBAT_TICKS:
                # The client has had time to receive combat_end: drop it from the snapshot
                del self.combats[user_id]
                del self._combat_finished_at[user_id]

    def _finish_combat(self, user_id: int, combat: CombatManager) -> None:
        player = self.players[user_id]
        state = combat.get_state()
        player.hp = state.player.hp
        player.mp = state.player.mp
        player.state &= ~PlayerState.IN_COMBAT
        if state.result is CombatResult.LOSE:
            player.state &= ~PlayerState.ALIVE
        elif state.result is CombatResult.WIN:
            pass
            # TODO: (Jose) on WIN, remove the defeated enemy from self.enemies

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
            or player_action.sequence <= player_actions[-1].sequence
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
