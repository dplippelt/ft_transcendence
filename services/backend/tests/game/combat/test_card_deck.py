from app.game.combat.card_deck import CardDeck, CardDeckConfig
from app.game.combat.card import Operator
import pytest
from collections import Counter

OPERATORS = [Operator.PLUS, Operator.MINUS, Operator.MULTIPLY, Operator.MODULO, Operator.DIVIDE]

def make_deck(operators: list[Operator] = OPERATORS, config: CardDeckConfig = CardDeckConfig()) -> CardDeck:
    return CardDeck(operators=operators, config=config)


def test_deck_has_configured_amount_with_values_in_range():
    deck = make_deck()
    assert len(deck._cards) == 20
    cards = [deck.deal() for _ in range(20)]
    for card in cards:
        if card.is_number():
            assert 1 <= card.value <= 30
        else:
            assert card.value in OPERATORS


def test_card_ids_are_unique_across_regenerations():
    deck = make_deck()
    cards = [deck.deal() for _ in range(65)] # more than three decks
    assert len({card.id for card in cards}) == 65


def test_same_only_selected_operators_are_generated():
    deck = make_deck(operators=[Operator.MULTIPLY], config=CardDeckConfig(amount=200))
    operators = {card.value for card in (deck.deal() for _ in range(200)) if card.is_operator()}
    assert operators == {Operator.MULTIPLY}


def test_weight_reduction_makes_repeats_rarer():
    def total_max_repeats(reduction_factor):
        config = CardDeckConfig(reduction_factor=reduction_factor)
        total = 0
        for _ in range(200):
            deck = make_deck(config=config)
            values = [deck.deal().value for _ in range(20)]
            total += max(Counter(values).values())
        return total

    assert total_max_repeats(0.3) < total_max_repeats(0.0)


def test_deck_requires_operators():
    with pytest.raises(ValueError):
        make_deck(operators=[])

