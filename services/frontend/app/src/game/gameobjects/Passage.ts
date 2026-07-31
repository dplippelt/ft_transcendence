import { Physics, Scene, Math } from "phaser";
import { Direction } from "../map/procedural";
import { GameEvents, GameManagerScene } from "../scenes/GameManagerScene";

type WallDirection = Direction.Top | Direction.Right | Direction.Down | Direction.Left;
export const OnPassageEnter = 'enter-passage'

interface PassageData {
  spriteKey: string,
  frameIndex: {
    open: number,
    close: number
  },
  scale: number,
  direction: WallDirection;
}

const wallRotation: Record<WallDirection, number> = {
  [Direction.Top]: 0,
  [Direction.Right]: Math.PI_OVER_2,
  [Direction.Down]: Math.PI_OVER_2 * 2,
  [Direction.Left]: Math.PI_OVER_2 * 3,
}

// TODO: Allow for custom collider size
export class Passage extends Physics.Arcade.Sprite {
  private collider: Physics.Arcade.Collider;
  private passageData: PassageData;

  constructor(scene: Scene, x: number, y: number, passageData: PassageData, dynamics: Physics.Arcade.Group) {
    super(scene, x, y, passageData.spriteKey, passageData.frameIndex.open);
    this.setRotation(wallRotation[passageData.direction]);

    const physics = scene.physics;
    this.collider = physics.add.collider(this, dynamics);
    this.scale = passageData.scale;
    this.passageData = passageData;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    GameManagerScene.EventsCenter.on(GameEvents.LevelComplete, this.unlock, this);
  }

  destroy(fromScene?: boolean): void {
    super.destroy(fromScene);
    this.collider.destroy();
  }

  // public accessible? regist the event outside to make it less dependent
  private unlock() {
    this.collider.active = false;
    this.setFrame(this.passageData.frameIndex.close);
  }
}
