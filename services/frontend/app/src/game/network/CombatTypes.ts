import type { Operator } from "../gameobjects/cards/CardBase";

export type CombatCard = {
  id: string;
  value: number | Operator;
};

export type CombatState = {
  combat_id: string;
  phase: "player_turn" | "enemy_turn" | "over";
  hand: CombatCard[];
  target_numbers: (number | null)[];
  player: {
    hp: number;
    max_hp: number;
    mp: number;
  };
  enemy: {
    hp: number;
    max_hp: number;
  };
  events: any[];
};
