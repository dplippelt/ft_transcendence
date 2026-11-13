from .card import Operator, CardValue, Card
from app.game.math_utils.random_util import shuffle
from dataclasses import dataclass
import random
from functools import reduce
import math

@dataclass
class CardDeckConfig:
    amount: int = 20
    number_min: int = 1
    number_max: int = 30
    number_weight: float = 70
    operator_weight: float = 30
    uniformity: float = 3
    reduction_factor: float = 0.3

@dataclass
class CardWeight:
    value: CardValue
    weight: float

class CardDeck:
    def __init__(
        self,
        operators: list[Operator],
        config: CardDeckConfig = CardDeckConfig(),
    ) -> None:
        if not operators:
            raise ValueError("a deck needs at least one operator")
        if config.amount <= 0:
            raise ValueError("deck amount must be positive")
        if config.number_min > config.number_max:
            raise ValueError("number_min must not exceed number_max")

        self._config = config
        number_count = config.number_max - config.number_min + 1
        number_weight = config.number_weight / number_count
        operator_weight = config.operator_weight / len(operators)

        self._base_weights: list[CardWeight] = [
            CardWeight(n, number_weight) for n in range(config.number_min, config.number_max + 1)
        ] + [CardWeight(op, operator_weight) for op in operators]
        self._number_reduction = number_weight * config.reduction_factor
        self._operator_reduction = operator_weight * config.reduction_factor
        self._cards: list[Card] = []
        self.init_deck()

    def init_deck(self):
        cards: list[Card] = []
        weights: list[CardWeight] = list(self._base_weights)

        for _ in range(self._config.amount):
            normalized_weights = self._softmax(weights)
            card_weight = weighted_random(normalized_weights)
            card = Card(card_weight.value)
            cards.append(card)
            self._adjust_weights(weights, card)

        shuffle(cards)

        self._cards = cards
        if len(self._cards) == 0:
            raise MemoryError("Could not create a new deck")

    def _adjust_weights(self, card_weights: list[CardWeight], card: Card):
        for card_weight in card_weights:
            if card_weight.value != card.value:
                continue
            reduction = self._operator_reduction if card.is_operator() else self._number_reduction
            card_weight.weight -= reduction
            return

    def _softmax(self, weights: list[CardWeight]) -> list[CardWeight]:
        normalized_weights = [
            CardWeight(card.value, math.exp(card.weight / self._config.uniformity)) for card in weights
        ]
        total = sum(card.weight for card in normalized_weights)
        if total:
            for card in normalized_weights:
                card.weight /= total
        return normalized_weights

    def _print_deck(self):
        i = 1
        for card in self._cards:
            print(i,": ", card.value, "id", card.id)
            i += 1

# source: https://blog.bruce-hill.com/a-faster-weighted-random-choice
def weighted_random(weights: list[CardWeight]) -> CardWeight:
    remaining: float = random.random() * reduce(
        lambda sum, curr: sum + curr.weight, weights, 0
    )

    for element in weights:
        remaining -= element.weight
        if remaining < 0:
            return element

    raise ValueError("Invalid weight values used")

# Debug code
operators = [Operator.PLUS, Operator.MINUS, Operator.MULTIPLY, Operator.MODULO, Operator.DIVIDE]
deck = CardDeck(operators=operators)
deck._print_deck()
