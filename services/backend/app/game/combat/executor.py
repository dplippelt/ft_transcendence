from collections.abc import Iterator
from enum import IntEnum
from itertools import permutations

from app.game.combat.card import Card, CardValue, Operator
from app.game.combat.card_deck import shuffle


class ExecuteCombo(IntEnum):
    ONE = 1
    TWO = 2
    THREE = 3


DAMAGE_TO_ENEMY: dict[ExecuteCombo, int] = {
    ExecuteCombo.ONE: 2,
    ExecuteCombo.TWO: 4,
    ExecuteCombo.THREE: 8,
}

_RANDOM_FORMULA_TRIES = 3

type Number = int | float


def _split_hand_in_numbers_and_operators(cards: list[Card]) -> tuple[list[Card], list[Card]]:
    numbers = [card for card in cards if card.is_number()]
    operators = [card for card in cards if card.is_operator()]
    return numbers, operators

def is_valid_hand(cards: list[Card]) -> bool:
    numbers, operators = _split_hand_in_numbers_and_operators(cards)
    return has_valid_card_combination(numbers, operators, 1)

def generate_target_numbers(hand: list[Card]) -> list[Number | None]:
    numbers, operators = _split_hand_in_numbers_and_operators(hand)
    return [generate_target_number(numbers, operators, num_operators) for num_operators in (1, 2, 3)]

def generate_target_number(numbers: list[Card], operators: list[Card], num_operators: int) -> Number | None:
    if not has_valid_card_combination(numbers, operators, num_operators):
        return None

    for _ in range(_RANDOM_FORMULA_TRIES):
        cards = _get_randomized_formula(numbers, operators, num_operators)
        if _is_valid_card_combination(cards):
            break
    else:
        cards = _get_valid_formula(numbers, operators, num_operators)

    result = evaluate(cards)
    assert result is not None
    return result

def has_valid_card_combination(numbers: list[Card], operators: list[Card], num_operators: int) -> bool:
    if len(numbers) < num_operators + 1 or len(operators) < num_operators:
        return False

    non_zero = sum(1 for number in numbers if number.value != 0)
    non_division_ops = sum(1 for op in operators if not op.is_division_operator())

    return non_zero >= max(0, num_operators - non_division_ops)

def _get_randomized_formula(numbers: list[Card], operators: list[Card], num_operators: int) -> list[Card]:
    cards: list[Card] = []

    numbers = list(numbers)
    operators = list(operators)
    shuffle(numbers)
    shuffle(operators)

    for i in range(num_operators):
        cards += [numbers[i], operators[i]]
    cards.append(numbers[num_operators])

    return cards

def _is_valid_card_combination(cards: list[Card]) -> bool:
    for i in range(2, len(cards), 2):
        operator = cards[i - 1]
        number = cards[i]
        if operator.is_division_operator() and number == 0:
            return False
    return True

def _get_valid_formula(numbers: list[Card], operators: list[Card], num_operators: int) -> list[Card]:
    zeros = [n for n in numbers if n.value == 0]
    non_zeros = [n for n in numbers if n.value != 0]

    non_division_ops = [op for op in operators if not op.is_division_operator()]
    division_ops = [op for op in operators if op.is_division_operator()]

    sorted_operators = division_ops + non_division_ops

    cards = [zeros.pop() if zeros else non_zeros.pop()]
    for _ in range(num_operators):
        operator = sorted_operators.pop()
        cards.append(operator)
        if not operator.is_division_operator() and zeros:
            cards.append(zeros.pop())
        else:
            cards.append(non_zeros.pop())
    return cards

def formulas(hand: list[Card], num_operators: int) -> Iterator[list[Card]]:
    numbers = [card for card in hand if card.is_number()]
    operators = [card for card in hand if card.is_operator()]
    for nums in permutations(numbers, num_operators + 1):
        for ops in permutations(operators, num_operators):
            cards = [nums[0]]
            for op, num in zip(ops, nums[1:], strict=True):
                cards += [op, num]
            yield cards

def evaluate(cards: list[Card]) -> Number | None:
    if not is_valid_selection(cards):
        return None

    values = _evaluate_high_precedence(cards)

    if values is None:
        return None

    return _evaluate_low_precedence(values)

def combo_for(cards: list[Card]) -> ExecuteCombo | None:
    num_operators = (len(cards) - 1) // 2

    match num_operators:
        case 1:
            return ExecuteCombo.ONE
        case 2:
            return ExecuteCombo.TWO
        case 3:
            return ExecuteCombo.THREE
        case _:
            return None

def _evaluate_high_precedence(cards: list[Card]) -> list[CardValue] | None:
    values: list[CardValue] = []

    for i, card in enumerate(cards):
        if i % 2 == 1:
            values.append(card.value)
            continue

        current = card.value
        if not values:
            values.append(current)
            continue

        operator = values.pop()
        previous = values.pop()

        match operator:
            case Operator.MULTIPLY:
                values.append(previous * current)
            case Operator.DIVIDE:
                if current == 0:
                    return None
                values.append(previous / current)
            case Operator.MODULO:
                if current == 0:
                    return None
                values.append(previous % current)
            case _:
                values.extend((previous, operator, current))

    return values

def _evaluate_low_precedence(vales: list[CardValue]) -> Number:
    result = vales[0]

    for i in range(2, len(vales), 2):
        current = vales[i]
        operator = vales[i - 1]

        match operator:
            case Operator.PLUS:
                result += current
            case Operator.MINUS:
                result -= current
    
    return result

def is_valid_selection(cards: list[Card]) -> bool:
    if len(cards) == 1 or len(cards) % 2 == 0:
        return False

    for i, card in enumerate(cards):
        if i % 2 == 0 and not card.is_number():
            return False
        if i % 2 == 1 and not card.is_operator():
            return False
    return True
