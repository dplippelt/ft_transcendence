import type { Scene } from "phaser";
import type Player from "../gameobjects/Player";
import type { Enemy } from "../gameobjects/Enemy";

export interface CombatEventData {
  player: Player;
  enemy: Enemy;
  sceneInvoker: Scene;
  // TODO: Add additional data required for the combat scene
}
