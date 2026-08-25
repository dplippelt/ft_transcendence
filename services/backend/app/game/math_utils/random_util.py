import math
import random
from functools import reduce
from typing import NamedTuple

from .vector2 import Vector2


class Weight(NamedTuple):
    indexx: int
    weight: float


def __random() -> float:
    return random.random()


def randomf(min: int, max: int) -> int:
    return min + math.floor(__random() * (max - min))


def random_point(min: Vector2, max: Vector2) -> Vector2:
    return Vector2(randomf(min.x, max.x), randomf(min.y, max.y))


# source: https://blog.bruce-hill.com/a-faster-weighted-random-choice
def weighted_random(weights: list[Weight]) -> Weight:
    remaining: float = __random() * reduce(
        lambda sum, curr: sum + curr.weight, weights, 0
    )

    print("\n".join([str(w) for w in weights]))
    print()
    for element in weights:
        remaining -= element.weight
        if remaining < 0:
            return element

    raise ValueError("Invalid weight values used")


# Fisher–Yates shuffle
def shuffle(arr: list[any]):
    for i in range(len(arr) - 1, 0, -1):
        pick = randomf(0, i + 1)
        arr[pick], arr[i] = arr[i], arr[pick]
