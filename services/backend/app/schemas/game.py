from enum import IntEnum, IntFlag, auto
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas import combat


class GameState(IntEnum):
    PAUSED = auto()
    RUNNING = auto()
    LEVEL_COMPLETE = auto()
    GAME_OVER = auto()


class ActionType(IntEnum):
    NONE = 0
    MOVE = auto()
    PICK_CARD = auto()
    DRAW_CARD = auto()
    PLAY_CARDS = auto()
    LEAVE = auto()
    DEBUG_START_COMBAT = 99 # TODO: remove when combats start from enemy collisions


class Direction(IntFlag):
    UP = auto()
    RIGHT = auto()
    DOWN = auto()
    LEFT = auto()


class PlayerState(IntFlag):
    NONE = 0
    WAITING = auto()
    ALIVE = auto()
    IN_COMBAT = auto()
    CONNECTED = auto()
    LEAVE = auto()


class EnemyFSMState(IntEnum):
    IDLE = auto()
    WANDER = auto()
    CHASE = auto()
    COMBAT = auto()
    RECALL = auto()
    DEAD = auto()


class Action(BaseModel):
    type: ActionType
    direction: Direction
    card: int
    cards: list[str] = Field(default_factory=list)


class PlayerAction(BaseModel):
    type: Literal["game.player.action"]
    game_id: str
    sequence: int
    action: Action


class Entity(BaseModel):
    x: int
    y: int


class Player(Entity):
    player_id: int
    sequence: int
    state: PlayerState
    hp: int
    mp: int


class Enemy(Entity):
    enemy_id: int
    fsm_state: EnemyFSMState


class GameSnapshot(BaseModel):
    type: Literal["game.snapshot"]
    game_id: str
    ticks_per_second: int
    tick_id: int
    state: GameState
    dungeon_seed: int
    user_player_id: int
    players: list[Player]
    enemies: list[Enemy]
    combat: list[combat.CombatState]


class NewGameSession(BaseModel):
    type: Literal["game.game-session"]
    game_id: str
