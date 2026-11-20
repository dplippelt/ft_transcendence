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
    UNKnOWN_CARD = "unknown_card"
    DUPLICATE_CARD = "duplicate_card"
    INVALID_SELECTION = "invalid_selection"
    NOT_ENOUGH_MP = "not_enough_mp"

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

class CombatEventBase(BaseModel):
    seq: int
    tick: int

class TurnStartedEvent(CombatEventBase):
    type: Literal["turn_started"] = "turn_started"
    phase: CombatPhase
    turn_ends_at_tick: int

class HandDealtEvent(CombatEventBase):
    type: Literal["hand_dealt"] = "hand_dealt"
    reason: Literal["turn_started", "redraw"]
    card_ids: list[int]

class PlayerAttackEvent(CombatEventBase):
    type: Literal["player_attack"] = "player_attack"
    card_ids: list[int]
    result: Number
    combo: int
    damage: int
    enemy_hp: int

class PlayMissedEvent(CombatEventBase):
    type: Literal["play_missed"] = "play_missed"
    card_ids: list[int]
    result: Number
    combo: int | None

class ActionRejectedEvent(CombatEventBase):
    type: Literal["action_rejected"] = "action_rejected"
    action: CombatAction
    reason: RejectReason
    card_ids: list[int] = Field(default_factory=list)

class PlayerGuardEvent(CombatEventBase):
    type: Literal["player_guard"] = "player_guard"

class EnemyAttackEvent(CombatEventBase):
    type: Literal["enemy_attack"] = "enemy_attack"
    damage: int
    player_hp: int

class CombatEndEvent(CombatEventBase):
    type: Literal["combat_end"] = "combat_end"
    result: CombatResult

CombatEvent = Annotated[
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
    turn_ends_at_tick: int | None
    result: CombatResult | None
    player: CombatPlayerStatus
    enemy: CombatEnemyStatus
    hand: list[CombatCard]
    target_numbers: list[Number | None]
    deck_count: int
    events: list[CombatEvent]

