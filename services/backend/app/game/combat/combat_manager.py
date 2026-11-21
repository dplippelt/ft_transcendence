from collections import deque
from collections.abc import Sequence
from dataclasses import dataclass
from enum import Enum
from itertools import count

from app.game.combat.turn_manager import TurnConfig, TurnManager

from app.game.combat import executor
from app.game.combat.card import Card, Operator
from app.game.combat.card_deck import DEFAULT_DECK_CONFIG, CardDeck, CardDeckConfig
from app.game.combat.card_hand import CardHand
from app.schemas.combat import (
    ActionRejectedEvent,
    CombatAction,
    CombatCard,
    CombatPlayerStatus,
    CombatEnemyStatus,
    CombatEndEvent,
    CombatEvent,
    CombatPhase,
    CombatResult,
    CombatState,
    EnemyAttackEvent,
    HandDealtEvent,
    PlayerAttackEvent,
    PlayerGuardEvent,
    PlayMissedEvent,
    RejectReason,
    TurnStartedEvent,
)


@dataclass
class PlayerStatus:
    hp: int
    max_hp: int
    mp: int

@dataclass
class EnemyData:
    hp: int
    max_hp: int
    attack_damage: int

class EnemyLevel(Enum):
    EASY = EnemyData(hp=5, max_hp=5, attack_damage=2)
    NORMAL = EnemyData(hp=16, max_hp=16, attack_damage=4)
    HARD = EnemyData(hp=25, max_hp=25, attack_damage=5)

TICKS_PER_SECOND = 20 # = 1 / FIXED_TIME_STEP in game_session.py

@dataclass(frozen=True)
class CombatConfig:
    hand_size: int = 8
    player_turn_ticks: int = 30 * TICKS_PER_SECOND
    enemy_turn_ticks: int = 3 * TICKS_PER_SECOND
    redraw_cost: int = 1
    max_events: int = 32 # Events kept in the state; must cover what can happen between two snapshots.
    max_deal_attempts: int = 100
    deck: CardDeckConfig = DEFAULT_DECK_CONFIG

DEFAULT_COMBAT_CONFIG = CombatConfig()

class CombatManager:
    def __init__(
            self,
            combat_id: str,
            player_id: int,
            enemy_id: int,
            player: CombatPlayerStatus,
            enemy: CombatEnemyStatus,
            operators: list[Operator],
            config: CombatConfig = DEFAULT_COMBAT_CONFIG,
        ) -> None:
        self.combat_id = combat_id
        self.player_id = player_id
        self.enemy_id = enemy_id
        self.player = CombatPlayerStatus(hp=player.hp, max_hp=player.max_hp, mp=player.mp)
        self.enemy = CombatEnemyStatus(hp=enemy.hp, max_hp=enemy.max_hp, attack_damage=enemy.attack_damage)
        self.config = config

        self.result: CombatResult | None = None
        self.target_numbers: list[executor.Number | None] = [None, None, None]

        self._deck = CardDeck(operators, config.deck)
        self._hand = CardHand(config.hand_size)
        self._turn_manager = TurnManager(TurnConfig(config.player_turn_ticks, config.enemy_turn_ticks))
        self._event_seq = count(1)
        self._events: deque[CombatEvent] = deque(maxlen=config.max_events)

    def start(self, tick: int) -> None:
        if self.is_started():
            raise RuntimeError("combat already started")
        self._start_player_turn(tick)

    def update(self, tick: int) -> None:
        expired = self._turn_manager.update(tick)
        if expired is CombatPhase.PLAYER_TURN:
            self._start_enemy_turn(tick, player_hit=False)
        elif expired is CombatPhase.ENEMY_TURN:
            self._start_player_turn(tick)

    def get_state(self) -> CombatState:
        if not self.is_started():
            raise RuntimeError("combat has not started")
        return CombatState(
            combat_id=self.combat_id,
            player_id=self.player_id,
            enemy_id=self.enemy_id,
            phase=self._turn_manager.phase,
            turn_ends_at_tick=self._turn_manager.turn_ends_at_tick,
            result=self.result,
            player=self.player,
            enemy=self.enemy,
            hand=[CombatCard(id=card.id, value=card.value) for card in self._hand.get_cards()],
            target_numbers=list(self.target_numbers),
            deck_count=len(self._deck),
            events=list(self._events),
        )

    def is_started(self) -> bool:
        return self._turn_manager.phase is not None

    def _start_player_turn(self, tick: int) -> None:
        self._turn_manager.start_player_turn(tick)
        self._add_event(TurnStartedEvent(
            seq=next(self._event_seq),
            tick=tick,
            phase=self._turn_manager.phase,
            turn_ends_at_tick=self._turn_manager.turn_ends_at_tick,
        ))
        self._deal_hand(tick)

    def _deal_hand(self, tick: int) -> None:
        for _ in range(self.config.max_deal_attempts):
            self._hand.clear()
            while not self._hand.is_full():
                self._hand.add(self._deck.deal())
            if executor.is_valid_hand(self._hand.get_cards()):
                break
        else:
            raise RuntimeError("could not deal a playable hand; check the config")
        
        self.target_numbers = executor.generate_target_numbers(self._hand.get_cards())
        self._add_event(HandDealtEvent(
            seq=next(self._event_seq),
            tick=tick,
            card_ids=[card.id for card in self._hand.get_cards()],
        ))

    def _start_enemy_turn(self, tick: int, player_hit: bool) -> None:
        self._turn_manager.start_enemy_turn(tick)
        self._add_event(TurnStartedEvent(
            seq=next(self._event_seq),
            tick=tick,
            phase=self._turn_manager.phase,
            turn_ends_at_tick=self._turn_manager.turn_ends_at_tick,
        ))

        if player_hit:
            self._add_event(PlayerGuardEvent(
                seq=next(self._event_seq),
                tick=tick,
            ))
            return

        damage = self.enemy.attack_damage
        self.player.hp = max(0, self.player.hp - damage)
        self._add_event(EnemyAttackEvent(
            seq=next(self._event_seq),
            tick=tick,
            damage=damage,
            player_hp=self.player.hp,
        ))

        if self.player.hp == 0:
            self._end(tick, CombatResult.LOSE)

    def play_cards(self, card_ids: Sequence[str], tick: int) -> bool:
        card_ids = list(card_ids)
        reason = self._check_play(card_ids)
        if reason is not None:
            self._add_event(ActionRejectedEvent(
                seq=next(self._event_seq),
                tick=tick,
                action=CombatAction.PLAY_CARDS,
                reason=reason,
            ))
            return False

        cards: list[Card] = [self._hand.get_by_id(id) for id in card_ids]
        result = executor.evaluate(cards)
        if result is None:
            self._add_event(ActionRejectedEvent(
                seq=next(self._event_seq),
                tick=tick,
                action=CombatAction.PLAY_CARDS,
                reason=RejectReason.INVALID_SELECTION,
            ))
            return False

        combo = executor.combo_for(cards)
        if combo is None or self.target_numbers[combo - 1] != result:
            self._add_event(PlayMissedEvent(
                seq=next(self._event_seq),
                tick=tick,
            ))
            return False

        damage = executor.DAMAGE_TO_ENEMY[combo]
        self.enemy.hp = max(0, self.enemy.hp - damage)
        self._add_event(PlayerAttackEvent(
            seq=next(self._event_seq),
            tick=tick,
            combo=int(combo),
            damage=damage,
        ))

        if self.enemy.hp == 0:
            self._end(tick, CombatResult.WIN)
        else:
            self._start_enemy_turn(tick, player_hit=True)

        return True

    def _check_play(self, card_ids: Sequence[str]) -> RejectReason | None:
        if not self._turn_manager.is_player_turn():
            return RejectReason.NOT_PLAYER_TURN
        if len(set(card_ids)) != len(card_ids):
            return RejectReason.DUPLICATE_CARD
        cards = [self._hand.get_by_id(id) for id in card_ids]
        if any(card is None for card in cards):
            return RejectReason.UNKNOWN_CARD
        if not executor.is_valid_selection(cards):
            return RejectReason.INVALID_SELECTION
        return None

    def redraw(self, tick: int) -> bool:
        if not self._turn_manager.is_player_turn():
            self._add_event(ActionRejectedEvent(
                seq=next(self._event_seq),
                tick=tick,
                action=CombatAction.REDRAW, 
                reason=RejectReason.NOT_PLAYER_TURN,
            ))
            return False
        if self.player.mp < self.config.redraw_cost:
            self._add_event(ActionRejectedEvent(
                seq=next(self._event_seq),
                tick=tick,
                action=CombatAction.REDRAW,
                reason=RejectReason.NOT_ENOUGH_MP,
            ))
            return False
        self.player.mp -= self.config.redraw_cost
        self._deal_hand(tick)
        return True

    def _end(self, tick: int, result: CombatResult) -> None:
        self._turn_manager.end()
        self.result = result
        self._add_event(CombatEndEvent(
            seq=next(self._event_seq),
            tick=tick,
            result=result
        ))

    def _add_event(self, event: CombatEvent) -> None:
        self._events.append(event)

