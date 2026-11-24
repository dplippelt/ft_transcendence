from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, Field

from app.game.combat.card import Operator
from app.game.combat.executor import Number


class CombatPhase(StrEnum):
    PLAYER_TURN = "player_turn"
    ENEMY_TURN = "enemy_turn"
    OVER = "over"

class CombatResult(StrEnum):
    WIN = "win"
    LOSE = "lose"

class CombatAction(StrEnum):
    PLAY_CARDS = "play_cards"
    REDRAW = "redraw"

class RejectReason(StrEnum):
    NOT_PLAYER_TURN = "not_player_turn"
    UNKNOWN_CARD = "unknown_card"
    DUPLICATE_CARD = "duplicate_card"
    INVALID_SELECTION = "invalid_selection"
    NOT_ENOUGH_MP = "not_enough_mp"

class CombatEventType(StrEnum):
    TURN_STARTED = "turn_started"
    HAND_DEALT = "hand_dealt"
    PLAYER_ATTACK = "player_attack"
    PLAYER_GUARD = "player_guard"
    PLAY_MISSED = "play_missed"
    ENEMY_ATTACK = "enemy_attack"
    COMBAT_END = "combat_end"
    ACTION_REJECTED = "action_rejected"

class CombatCard(BaseModel):
    id: str
    value: int | Operator

class CombatPlayerStatus(BaseModel):
    hp: int
    max_hp: int
    mp: int

class CombatEnemyStatus(BaseModel):
    hp: int
    max_hp: int
    attack_damage: int

class CombatEventBase(BaseModel):
    seq: int
    tick: int

class TurnStartedEvent(CombatEventBase):
    type: Literal[CombatEventType.TURN_STARTED] = CombatEventType.TURN_STARTED
    phase: CombatPhase
    turn_ends_at_tick: int

class HandDealtEvent(CombatEventBase):
    type: Literal[CombatEventType.HAND_DEALT] = CombatEventType.HAND_DEALT
    player: CombatPlayerStatus
    hand: list[CombatCard]
    target_numbers: list[Number | None]

class PlayerAttackEvent(CombatEventBase):
    type: Literal[CombatEventType.PLAYER_ATTACK] = CombatEventType.PLAYER_ATTACK
    combo: int
    enemy: CombatEnemyStatus

class PlayMissedEvent(CombatEventBase):
    type: Literal[CombatEventType.PLAY_MISSED] = CombatEventType.PLAY_MISSED

class PlayerGuardEvent(CombatEventBase):
    type: Literal[CombatEventType.PLAYER_GUARD] = CombatEventType.PLAYER_GUARD

class EnemyAttackEvent(CombatEventBase):
    type: Literal[CombatEventType.ENEMY_ATTACK] = CombatEventType.ENEMY_ATTACK
    player: CombatPlayerStatus

class CombatEndEvent(CombatEventBase):
    type: Literal[CombatEventType.COMBAT_END] = CombatEventType.COMBAT_END
    result: CombatResult

class ActionRejectedEvent(CombatEventBase):
    type: Literal[CombatEventType.ACTION_REJECTED] = CombatEventType.ACTION_REJECTED
    action: CombatAction
    reason: RejectReason

type CombatEvent = Annotated[
    TurnStartedEvent
    | HandDealtEvent
    | PlayerAttackEvent
    | PlayMissedEvent
    | ActionRejectedEvent
    | PlayerGuardEvent
    | EnemyAttackEvent
    | CombatEndEvent,
    Field(discriminator="type")
]

class CombatState(BaseModel):
    combat_id: str
    player_id: int
    enemy_id: int
    phase: CombatPhase
    turn_started_at_tick: int | None
    turn_ends_at_tick: int | None
    result: CombatResult | None
    player: CombatPlayerStatus
    enemy: CombatEnemyStatus
    hand: list[CombatCard]
    target_numbers: list[Number | None]
    events: list[CombatEvent]

