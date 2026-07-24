import Phaser, { Physics, Scene, Math, GameObjects } from "phaser";
import { Direction } from "../map/procedural";

type WallDirection = Direction.Top | Direction.Right | Direction.Down | Direction.Left;
type ColliderType = Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile;
export const OnPassageEnter = 'enter-passage'

interface PassageData {
  spriteKey: string,
  frameIndex: number,
  scale: number,
  direction: WallDirection;
}

const wallRotation: Record<WallDirection, number> = {
  [Direction.Top]: 0,
  [Direction.Right]: Math.PI_OVER_2,
  [Direction.Down]: Math.PI_OVER_2 * 2,
  [Direction.Left]: Math.PI_OVER_2 * 3,
}

export class Passage extends Physics.Arcade.Sprite {
  private collider: Physics.Arcade.Collider;
  private trigger: Physics.Arcade.Collider;

  constructor(scene: Scene, x: number, y: number, passageData: PassageData, dynamics: Physics.Arcade.Group) {
    super(scene, x, y, passageData.spriteKey, passageData.frameIndex);
    this.setRotation(wallRotation[passageData.direction]);

    const physics = scene.physics;
    this.collider = physics.add.collider(this, dynamics);
    this.trigger = physics.add.overlap(this, dynamics, this.onEnter, undefined, this);
    this.trigger.active = false;
    this.scale = passageData.scale;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    // TODO: listen to the game events
  }

  destroy(fromScene?: boolean): void {
    this.destroy(fromScene);

    this.collider.destroy();
    this.trigger.destroy();
  }

  private unlocked() {
    this.collider.active = false;
    this.trigger.active = true;
  }

  private onEnter(entity: ColliderType): void {
    if ((entity as GameObjects.GameObject).name !== "player") {
      return;
    }

    // TODO: emit event w/ entity
  }
}
