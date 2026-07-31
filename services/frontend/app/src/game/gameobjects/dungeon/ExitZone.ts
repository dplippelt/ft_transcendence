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
  constructor(scene: Scene, position: Vector2Like, size: Vector2Like, players: Physics.Arcade.Group) {
    super(scene, position.x, position.y, size.x, size.y);

    scene.physics.world.enableBody(this);
    scene.physics.add.overlap(this, players, this.onEnter, undefined, this);
  }

  onEnter(entity: ColliderType) {
    if ((entity as GameObjects.GameObject).name !== "player") {
      return;
    }

    GameManagerScene.EventsCenter.emit(GameEvents.LevelExit, {
      player: entity as Player,
    });
  }
}
