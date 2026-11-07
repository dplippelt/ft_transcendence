from typing import NamedTuple, Self

from .vector2 import Vector2


class Bound2D(NamedTuple):
    min: int
    max: int


class BoundingBox:
    def __init__(self, min: Vector2, size: Vector2):  # renamed argument position to min
        self.min: Vector2 = min.clone()
        self.size: Vector2 = size.clone()
        self.max: Vector2 = Vector2.addition(min, size)

    def is_overlap(self, other: Self) -> bool:
        return not (
            self.min.x > other.max.x - 1
            or self.max.x - 1 < other.min.x
            or self.min.y > other.max.y - 1
            or self.max.y - 1 < other.min.y
        )

    def is_point_within(self, point: Vector2) -> bool:
        return not (
            point.x < self.min.x
            or point.x > self.max.x - 1
            or point.y < self.min.y
            or point.y > self.max.y - 1
        )

    def place(self, position: Vector2) -> Self:
        self.min = position.clone()
        self.max = Vector2.addition(self.min, self.size)
        return self

    def move(self, offset: Vector2) -> Self:
        _ = self.min.add(offset)
        self.max = Vector2.addition(self.min, self.size)
        return self

    def shrink(self) -> Self:
        if self.size.x < 2 or self.size.y < 2:
            raise ArithmeticError("Bounding box size is too small to shrink")

        _ = self.min.addXY(1, 1)
        _ = self.max.subXY(1, 1)
        _ = self.size.subXY(2, 2)
        return self

    def area(self) -> int:
        return self.size.x * self.size.y

    def clone(self) -> Self:
        return type(self)(self.min.clone(), self.size.clone())

    def __str__(self) -> str:
        return f'min {self.min}, max {self.max}, size {self.size}'
