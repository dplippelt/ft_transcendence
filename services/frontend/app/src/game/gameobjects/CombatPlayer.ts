import Phaser, { Scene } from "phaser";
import type { PlayerStatus } from "../scenes/CombatScene";
import { AssetsKey } from "../Assets";
import { EventBus } from "../EventBus";
import { CombatEvent } from "../../utils/utils";

export default class CombatPlayer extends Phaser.GameObjects.Sprite {
  readonly status: PlayerStatus;

  constructor(scene: Scene, status: PlayerStatus) {
    super(scene, 0, 0, AssetsKey.CombatPlayer, "idle/frame0000");
    this.status = status;
    this.scene.add.existing(this);
    this.setOrigin(0.5, 1);
  }

  takeDamage(damage: number) {
    this.status.hitPoint -= damage;
    EventBus.emit(CombatEvent.updatePlayerHP, this.status.hitPoint);
  }

  isDead() {
    return this.status.hitPoint <= 0;
  }
}
