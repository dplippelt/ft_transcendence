import Phaser, { Scene } from "phaser";
import { type SnapshotPlayer } from "../network/IGameSocket";
import { type IPlayerConfig } from "../gameobjects/Player";
import InterpolatedMovementComponent from "../components/InterpolatedMovementComponent";
import { DepthOrder } from "../Assets";

export default class PlayerMulti extends Phaser.GameObjects.Sprite {
  readonly id: number;
  readonly movement: InterpolatedMovementComponent;

  constructor(scene: Scene, state: SnapshotPlayer, config: IPlayerConfig) {
    super(scene, state.x, state.y, config.texture);
    this.id = state.player_id;
    this.name = `player_${state.player_id}`;
    this.movement = new InterpolatedMovementComponent(this);
    this.scene.add.existing(this);
    this.setDepth(DepthOrder.playerAndEnemies);
  }
  applyState(state: SnapshotPlayer) {
    this.movement.setTarget(state.x, state.y);
  }
}
