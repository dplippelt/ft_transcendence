from collections.abc import Sequence
from dataclasses import dataclass
from enum import Enum

from app.game.combat import executor
from app.game.combat.card import Card, Operator
from app.game.combat.card_deck import CardDeck
from app.game.combat.card_hand import CardHand


@dataclass
class PlayerStatus:
    hp: int
    mana: int


@dataclass
class EnemyData:
    hp: int
    attack_damage: int

class EnemyLevel(Enum):
    EASY = EnemyData(hp=5, attack_damage=2)
    NORMAL = EnemyData(hp=16, attack_damage=4)
    HARD = EnemyData(hp=25, attack_damage=5)


class CombatManager:
    def __init__(
            self,
            player_status: PlayerStatus,
            enemy_data: EnemyData,
            operators: list[Operator],
        ) -> None:
        self._player_status = player_status
        self._enemy_data = enemy_data
        self._deck = CardDeck(operators)
        self._hand = CardHand()

    def _deal_hand(self) -> None:
        for _ in range(10):
            self._hand.clear()
            while not self._hand.is_full():
                self._hand.add(self._deck.deal())
            if executor.is_valid_hand(self._hand):
                break
        else:
            raise RuntimeError("could not deal a playable hand; check the config")
        

        self.target_numbers = executor.generate_target_numbers(self._hand)

    def execute(self, card_ids: Sequence[int]) -> bool:
        card_ids = list(card_ids)
        # card ids check

        cards: list[Card] = [self._hand.get_by_id(id) for id in card_ids]
        # validate cards
        result = executor.evaluate(cards)
        if result is None:
            # notify to the users
            return False

        combo = executor.combo_for(cards)
        damage = executor.DAMAGE_TO_ENEMY[combo]
        self._enemy_data.hp = max(0, self._enemy_data.hp - damage)

        # if self._enemy_data.hit_point <= 0:
        #     self._end()
        # else:
        #     self._start_enemy_turn()

        return True
        


