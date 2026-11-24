import type { Operator } from "../gameobjects/cards/CardBase";

export enum CombatPhase {
  PLAYER_TURN = "player_turn",
  ENEMY_TURN = "enemy_turn",
  OVER = "over",
}

export enum CombatResult {
  WIN = "win",
  LOSE = "lose",
}

export type CombatCard = {
  id: string;
  value: number | Operator;
};

export interface CombatPlayerStatus {
  hp: number;
  max_hp: number;
  mp: number;
}

export interface CombatEnemyStatus {
  hp: number;
  max_hp: number;
  attack_damage: number;
}

export enum CombatEventType {
  TURN_STARTED = "turn_started",
  HAND_DEALT = "hand_dealt",
  PLAYER_ATTACK = "player_attack",
  PLAYER_GUARD = "player_guard",
  PLAY_MISSED = "play_missed",
  ENEMY_ATTACK = "enemy_attack",
  COMBAT_END = "combat_end",
  ACTION_REJECTED = "action_rejected",
}

export interface CombatEventBase {
  seq: number;
  tick: number;
}

export interface TurnStartedEvent extends CombatEventBase {
  type: CombatEventType.TURN_STARTED;
  phase: CombatPhase;
  turn_ends_at_tick: number;
}

export interface HandDealtEvent extends CombatEventBase {
  type: CombatEventType.HAND_DEALT;
  player: CombatPlayerStatus;
  hand: CombatCard[];
  target_numbers: (number | null)[],
}

export interface PlayerAttackEvent extends CombatEventBase {
  type: CombatEventType.PLAYER_ATTACK;
  combo: number;
  enemy: CombatEnemyStatus;
}

export interface PlayMissedEvent extends CombatEventBase {
  type: CombatEventType.PLAY_MISSED;
}

export interface PlayerGuardEvent extends CombatEventBase {
  type: CombatEventType.PLAYER_GUARD;
}

export interface EnemyAttackEvent extends CombatEventBase {
  type: CombatEventType.ENEMY_ATTACK;
  player: CombatPlayerStatus;
}

export interface CombatEndEvent extends CombatEventBase {
  type: CombatEventType.COMBAT_END;
  result: CombatResult;
}

export interface ActionRejectedEvent extends CombatEventBase {
  type: CombatEventType.ACTION_REJECTED;
  action: string;
  reason: string;
}

export type CombatActionEvent =
  | TurnStartedEvent
  | HandDealtEvent
  | PlayerAttackEvent
  | PlayMissedEvent
  | PlayerGuardEvent
  | EnemyAttackEvent
  | CombatEndEvent
  | ActionRejectedEvent;

export type CombatState = {
  combat_id: string;
  player_id: number;
  enemy_id: number;
  phase: CombatPhase;
  turn_started_at_tick: number | null;
  turn_ends_at_tick: number | null;
  result: CombatResult | null;
  player: CombatPlayerStatus;
  enemy: CombatEnemyStatus;
  hand: CombatCard[];
  target_numbers: (number | null)[];
  events: CombatActionEvent[];
};
