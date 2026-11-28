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

// TODO: should match with the backend schemas
export interface CombatEvent {
    seq: number;
    tick: number;
    type: string;
}

export type CombatState = {
  combat_id: string;
  player_id: number;
  enemy_id: number;
  phase: CombatPhase;
  turn_ends_at_tick: number | null;
  result: CombatResult | null;
  player: CombatPlayerStatus;
  enemy: CombatEnemyStatus;
  hand: CombatCard[];
  target_numbers: (number | null)[];
  deck_count: number;
  events: CombatEvent[];
};
