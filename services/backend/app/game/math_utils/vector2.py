import math
from typing import NamedTuple, Self


class Point2D(NamedTuple):
    x: int
    y: int


# TODO: this an int vector instead of float vector (issues?)
class Vector2:
    def __init__(self, x: int = 0, y: int = 0):
        self.x: int = x
        self.y: int = y

    def clone(self) -> Self:
        return type(self)(self.x, self.y)

    def flip(self) -> Self:
        self.x *= -1
        self.y *= -1
        return self

    def scalef(self, scalar: float) -> Self:
        self.x = math.floor(self.x * scalar)
        self.y = math.floor(self.y * scalar)
        return self

    def abs(self) -> Self:
        self.x = self.x if self.x >= 0 else -self.x
        self.y = self.y if self.y >= 0 else -self.y
        return self

    def scale(self, scalar: int) -> Self:
        self.x *= scalar
        self.y *= scalar
        return self

    def add(self, other: Self) -> Self:
        self.x += other.x
        self.y += other.y
        return self

    def addXY(self, x: int, y: int) -> Self:
        self.x += x
        self.y += y
        return self

    def sub(self, other: Self) -> Self:
        self.x -= other.x
        self.y -= other.y
        return self

    def subXY(self, x: int, y: int) -> Self:
        self.x -= x
        self.y -= y
        return self

    def mul(self, other: Self) -> Self:
        self.x *= other.x
        self.y *= other.y
        return self

    def mulXY(self, x: int, y: int) -> Self:
        self.x *= x
        self.y *= y
        return self

    def equals(self, other: Self) -> bool:
        return self.x == other.x and self.y == other.y

    def unpack(self) -> Point2D:
        return Point2D(x=self.x, y=self.y)

    def __str__(self):
        return f'<{self.x}, {self.y}>'

    @classmethod
    def max(cls, a: Self, b: Self) -> Self:
        return cls(max(a.x, b.x), max(a.y, b.y))

    @classmethod
    def min(cls, a: Self, b: Self) -> Self:
        return cls(min(a.x, b.x), min(a.y, b.y))

    @classmethod
    def addition(cls, a: Self, b: Self) -> Self:
        return cls(a.x + b.x, a.y + b.y)

    @classmethod
    def subtract(cls, a: Self, b: Self) -> Self:
        return cls(a.x - b.x, a.y - b.y)

    @classmethod
    def multiply(cls, a: Self, b: Self) -> Self:
        return cls(a.x * b.x, a.y * b.y)
