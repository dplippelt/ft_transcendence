import Phaser, { Scene } from "phaser";
import type { PlayerStatus } from "../scenes/CombatScene";
import { AssetsKey } from "../Assets";
import type CombatEnemy from "./CombatEnemy";
import { CombatAnimEvents } from "./CombatManager";

export default class CombatPlayer extends Phaser.GameObjects.Sprite {
  readonly status: PlayerStatus;

  constructor(scene: Scene, status: PlayerStatus) {
    super(scene, 0, 0, AssetsKey.CombatPlayer, "idle/frame0000");
    this.status = status;
    this.scene.add.existing(this);
  }

  takeDamage(damage: number) {
    this.emit(CombatAnimEvents.TAKEDAMAGE, this);
    this.status.hitPoint -= damage;
  }

  attack(enemy: CombatEnemy, points: number) {
    this.emit(CombatAnimEvents.ATTACK, this);
    enemy.takeDamage(points);
  }

  isDead() {
    return this.status.hitPoint <= 0;
  }
}
