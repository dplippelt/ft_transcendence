import type { Scene } from "phaser";
import type Player from "../gameobjects/Player";
import type { Enemy } from "../gameobjects/Enemy";

export interface ICombatEventData {
  player: Player; // player initiating the combat
  enemy: Enemy; // enemy initiating the combat
  isPlayerDefeated: boolean;
  sceneInvoker: Scene;
  // TODO: Additional data required for the combat scene
}
