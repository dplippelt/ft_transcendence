from dataclasses import dataclass
from enum import IntEnum, IntFlag, StrEnum, auto
from typing import NamedTuple, Self

from app.game.math_utils.bounding_box import Bound2D, BoundingBox
from app.game.math_utils.random_util import randomf
from app.game.math_utils.vector2 import Vector2


class Direction(IntFlag):
    NONE = auto()
    TOP = auto()
    RIGHT = auto()
    DOWN = auto()
    LEFT = auto()
    TOP_LEFT = TOP | LEFT
    TOP_RIGHT = TOP | RIGHT
    DOWN_LEFT = DOWN | LEFT
    DOWN_RIGHT = DOWN | RIGHT


class TileNodeType(IntEnum):
    NONE = auto()
    ENTER_POINT = auto()
    SPAWN_POINT = auto()
    EXIT_POINT = auto()


class RoomType(IntEnum):
    NONE = auto()
    STANDARD = auto()
    ENTRANCE = auto()
    EXIT = auto()


class Tile(StrEnum):
    NONE = "."
    OPEN = "_"
    WALL = "#"
    CORNER = "@"
    DOOR = "D"
    ENTER = "<"
    EXIT = ">"
    SPAWN = "S"


@dataclass
class TileNode:
    position: Vector2
    type: TileNodeType


@dataclass
class Door:
    position: Vector2
    direction: Direction


@dataclass
class Room:
    id: int
    aabb: BoundingBox
    doors: list[Door]
    type: RoomType
    tile_node: TileNode | None

    def has_open_space(self) -> bool:
        return self.aabb.size.x > 2 and self.aabb.size.y > 2

    @classmethod
    def create_room(cls, id: int, width: Bound2D, height: Bound2D) -> Self:
        return cls(
            id=id,
            aabb=BoundingBox(
                min=Vector2(0, 0),
                size=Vector2(
                    randomf(width.min, width.max + 1),
                    randomf(height.min, height.max + 1),
                ),
            ),
            doors=[],
            type=RoomType.NONE,
            tile_node=None,
        )


class DungeonConfig(NamedTuple):
    room_count: Bound2D
    room_width: Bound2D
    room_height: Bound2D
    door_count: Bound2D
