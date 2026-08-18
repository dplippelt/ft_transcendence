from enum import Flag, IntEnum, auto
from typing import Literal

from pydantic import BaseModel


class GameState(IntEnum):
    PAUSED = auto()
    RUNNING = auto()
    LEVEL_COMPLETE = auto()
    GAME_OVER = auto()


class ActionType(IntEnum):
    NONE = auto()
    MOVE = auto()
    PICK_CARD = auto()
    DRAW_CARD = auto()
    PLAY_CARDS = auto()


class Direction(Flag):
    UP = auto()
    RIGHT = auto()
    DOWN = auto()
    LEFT = auto()


class PlayerState(Flag):
    NONE = auto()
    ALIVE = auto()
    IN_COMBAT = auto()
    CONNECTED = auto()


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


class PlayerAction(BaseModel):
    type: Literal["player_action"]
    game_id: int
    player_id: int
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
    type: Literal["game_snapshot"]
    game_id: int
    tick_id: int
    state: GameState
    dungeon_seed: int
    players: list[Player]
    enemies: list[Enemy]
