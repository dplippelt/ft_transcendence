import type { Scene } from "phaser";
import type Player from "../gameobjects/Player";
import type { Enemy } from "../gameobjects/Enemy";

export interface ICombatEventData {
  player: Player;
  enemy: Enemy;
  isPlayerDefeated: boolean;
  sceneInvoker: Scene;
  // TODO: Add additional data required for the combat scene
}
