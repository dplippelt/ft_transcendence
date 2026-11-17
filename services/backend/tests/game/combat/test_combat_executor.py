import pytest

from app.game.combat.card import Card, Operator
from app.game.combat.card_deck import CardDeck
from app.game.combat import executor

P = Operator.PLUS
M = Operator.MINUS
X = Operator.MULTIPLY
D = Operator.DIVIDE
MOD = Operator.MODULO


def cards(*values) -> list[Card]:
    return [Card(value) for value in values]

@pytest.mark.parametrize(
    ("values", "expected"),
    [
        ((2, P, 3), 5),
        ((2, P, 3, X, 4), 14),
        ((10, M, 6, D, 4), 8.5),
        ((6, D, 3), 2),
        ((7, MOD, 3, P, 1), 2),
        ((2, X, 3, X, 4), 24),
        ((1, M, 5, M, 5), -9),
    ],
)
def test_evaluate_follows_operator_precedence(values, expected):
    result = executor.evaluate(cards(*values))
    assert result == expected
    assert type(result) is type(result)


@pytest.mark.parametrize(
    ("values"),
    [
        (),
        (3,),
        (3, P),
        (P, 3, P),
        (3, 4, P),
        (3, P, P),
        (3, P, 4, P),
    ],
)
def test_malformed_selection_is_rejected(values):
    selection = cards(*values)
    assert not executor.is_valid_selection(selection)
    assert executor.evaluate(selection) is None


@pytest.mark.parametrize("operator", [D, MOD])
def test_division_by_zero_is_rejected(operator):
    assert executor.evaluate(cards(3, operator, 0)) is None


@pytest.mark.parametrize(
    ("length", "combo"),
    [
        (3, 1),
        (5, 2),
        (7, 3),
        (9, None),
    ],
)
def test_combo_is_the_number_of_operators(length, combo):
    assert executor.combo_for([None] * length) == combo


@pytest.mark.parametrize(
    ("numbers", "operators", "num_operators", "expected"),
    [
        ((1, 2), (P,), 1, True),
        ((1, ), (P,), 1, False),
        ((1, 2, 3), (P,), 2, False),
        ((0, 0), (P,), 1, True), # 0 + 0 is fine
        ((0, 0), (D,), 1, False), # 0 / 0 is not
        ((0, 5), (D,), 1, True), # 0 / 5
        ((0, 0, 5), (D, MOD), 2, False), # needs two non-zero divisors
        ((0, 0, 5), (D, P), 2, True),
    ],
)
def test_has_valid_card_combination(numbers, operators, num_operators, expected):
    assert executor.has_valid_card_combination(cards(*numbers), cards(*operators), num_operators) is expected


def test_get_valid_formula_never_divides_by_zero():
    numbers = cards(0, 0, 5, 7)
    operators = cards(D, MOD, P)
    for num_operators in (1, 2, 3):
        formula = executor._get_valid_formula(numbers, operators, num_operators)
        assert executor.evaluate(formula) is not None


def test_target_numbers_are_reachable_from_the_hand():
    deck = CardDeck(list(Operator))
    hand = [deck.deal() for _ in range(8)]

    targets = executor.generate_target_numbers(hand)

    numbers = [c for c in hand if c.is_number()]
    operators = [c for c in hand if c.is_operator()]
    for num_operators, target in zip((1, 2, 3), targets, strict=True):
        if not executor.has_valid_card_combination(numbers, operators, num_operators):
            assert target is None
            continue
        results = {executor.evaluate(f) for f in executor.formulas(hand, num_operators)}
        assert target in results


def test_is_valid_hand_needs_a_one_operator_formula():
    assert executor.is_valid_hand(cards(1, 2, P, 9, 9))
    assert not executor.is_valid_hand(cards(1, 2, 3, 4)) # no operator
    assert not executor.is_valid_hand(cards(1, P, X, D)) # one number
