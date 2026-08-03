import { GameObjects, Physics, Scene, type Types } from "phaser";
import { GameEvents, GameManagerScene } from "../../scenes/GameManagerScene";
import type Player from "../Player";

type Vector2Like = Types.Math.Vector2Like;
type ColliderType =
  | Phaser.Types.Physics.Arcade.GameObjectWithBody
  | Phaser.Physics.Arcade.Body
  | Phaser.Physics.Arcade.StaticBody
  | Phaser.Tilemaps.Tile;

export class ExitZone extends GameObjects.Zone {
  collider: Physics.Arcade.Collider | undefined;

  constructor(scene: Scene, position: Vector2Like, size: Vector2Like) {
    super(scene, position.x, position.y, size.x, size.y);

    scene.add.existing(this);
    scene.physics.world.enableBody(this);
  }

  destroy(fromScene?: boolean): void {
    super.destroy(fromScene);
    this.collider?.destroy();
  }

  overlapWithGroup(group: Physics.Arcade.Group) {
    if (this.collider !== undefined) {
      this.collider.destroy();
    }

    this.collider = this.scene.physics.add.overlap(this, group, this.onEnter, undefined, this);
  }

  private onEnter(entity: ColliderType) {
    if ((entity as GameObjects.GameObject).name !== "player") {
      return;
    }

    GameManagerScene.EventsCenter.emit(GameEvents.LevelExit, {
      player: entity as Player,
    });
  }
}
