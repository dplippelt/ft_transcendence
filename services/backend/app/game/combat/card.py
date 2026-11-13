from enum import StrEnum
import uuid

class Operator(StrEnum):
    PLUS = "+"
    MINUS = "-"
    MULTIPLY = "×"
    DIVIDE = "/"
    MODULO = "mod"

type CardValue = int | Operator

class Card:
    def __init__(
        self,
        value: CardValue
    ):
        self.id = uuid.uuid4()
        self.value = value

    def is_number(self) -> bool:
        return not isinstance(self.value, Operator)

    def is_operator(self) -> bool:
        return isinstance(self.value, Operator)

    def is_division_operator(self) -> bool:
        return self.value == Operator.DIVIDE or self.value == Operator.MODULO

