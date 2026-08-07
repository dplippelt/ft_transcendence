import { Physics, Scene, type Types } from "phaser";
import { GameEvents, GameManagerScene } from "../scenes/GameManagerScene";

type Vector2Like = Types.Math.Vector2Like;

interface PassageData {
  spriteKey: string;
  frame: {
    open: number;
    close: number;
  };
  scale: number;
}

export class Passage extends Physics.Arcade.Sprite {
  private collider: Physics.Arcade.Collider | undefined;
  private passageData: PassageData;

  constructor(scene: Scene, position: Vector2Like, passageData: PassageData) {
    super(scene, position.x, position.y, passageData.spriteKey, passageData.frame.open);

    this.scale = passageData.scale;
    this.passageData = passageData;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    // TODO: Make the call to a session manager or to the scene owning the passage
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
