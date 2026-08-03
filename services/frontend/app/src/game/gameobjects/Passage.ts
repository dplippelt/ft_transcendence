import { Physics, Scene, Math, type Types } from "phaser";
import { Direction } from "../map/procedural";
import { GameEvents, GameManagerScene } from "../scenes/GameManagerScene";

type Vector2Like = Types.Math.Vector2Like;
type WallDirection = Direction.Top | Direction.Right | Direction.Down | Direction.Left;
export const OnPassageEnter = "enter-passage";

interface PassageData {
  spriteKey: string;
  frame: {
    open: number;
    close: number;
  };
  scale: number;
  direction: WallDirection;
}

// TODO: Remove wall rotation
const wallRotation: Record<WallDirection, number> = {
  [Direction.Top]: 0,
  [Direction.Right]: Math.PI_OVER_2,
  [Direction.Down]: Math.PI_OVER_2 * 2,
  [Direction.Left]: Math.PI_OVER_2 * 3,
};

// TODO: Allow for custom collider size
export class Passage extends Physics.Arcade.Sprite {
  private collider: Physics.Arcade.Collider | undefined;
  private passageData: PassageData;

  constructor(scene: Scene, position: Vector2Like, passageData: PassageData) {
    super(scene, position.x, position.y, passageData.spriteKey, passageData.frame.open);
    this.setRotation(wallRotation[passageData.direction]);

    this.scale = passageData.scale;
    this.passageData = passageData;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    // TODO: Instead of the game manager perhaps use scene instead?
    GameManagerScene.EventsCenter.on(GameEvents.LevelComplete, this.unlock, this);
  }

  destroy(fromScene?: boolean): void {
    super.destroy(fromScene);
    this.collider?.destroy();
  }

  collideWithGroup(group: Physics.Arcade.Group) {
    this.collider = this.scene.physics.add.collider(this, group);
  }

  private unlock() {
    if (this.collider !== undefined) {
      this.collider.active = false;
    }

    this.setFrame(this.passageData.frame.close);
  }
}
