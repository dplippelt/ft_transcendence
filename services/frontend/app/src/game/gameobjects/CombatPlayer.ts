import Phaser, { Scene } from "phaser";
import type { PlayerStatus } from "../scenes/CombatScene";
import { AssetsKey } from "../Assets";

export default class CombatPlayer extends Phaser.GameObjects.Sprite {
  readonly status: PlayerStatus;

  constructor(scene: Scene, status: PlayerStatus) {
    super(scene, 0, 0, AssetsKey.CombatPlayer, "idle/frame0000");
    this.status = status;
    this.scene.add.existing(this);
  }

  takeDamage(damage: number) {
    this.status.hitPoint -= damage;
  }

  isDead() {
    return this.status.hitPoint <= 0;
  }
}
