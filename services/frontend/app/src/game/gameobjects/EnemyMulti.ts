import Phaser, { Scene } from "phaser";
import { type SnapshotEnemy } from "../network/IGameSocket";
import { AssetsKey, DepthOrder } from "../Assets";
import InterpolatedMovementComponent from "../components/InterpolatedMovementComponent";

export default class EnemyMulti extends Phaser.GameObjects.Sprite {
  readonly id: number;
  readonly movement: InterpolatedMovementComponent;

  constructor(scene: Scene, state: SnapshotEnemy) {
    super(scene, state.x, state.y, AssetsKey.Skeleton);
    this.id = state.enemy_id;
    this.movement = new InterpolatedMovementComponent(this);
    this.scene.add.existing(this);
    this.setDepth(DepthOrder.playerAndEnemies);
  }
  applyState(state: SnapshotEnemy) {
    this.movement.setTarget(state.x, state.y);
  }
}
