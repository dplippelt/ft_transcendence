from app.game.combat.card import Card


class CardHand:
    def __init__(self, max_cards: int = 8) -> None:
        if max_cards <= 0:
            raise ValueError("max_cards must be positive")
        self._cards: list[Card] = []
        self._max_cards = max_cards

    def __len__(self) -> int:
        return len(self._cards)

    def add(self, card: Card) -> None:
        if self.is_full():
            raise ValueError("hand is full")
        self._cards.append(card)

    def clear(self) -> None:
        self._cards.clear()

    def is_full(self) -> bool:
        return len(self._cards) >= self._max_cards

    def get_by_id(self, card_id: str) -> Card | None:
        for card in self._cards:
            if (card.id == card_id):
                return card
        return None

    def get_cards(self) -> list[Card]:
        return list(self._cards)

