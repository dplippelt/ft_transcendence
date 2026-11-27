import Component from "./Component";
import { GameObjects } from "phaser";
import { Math as PhaserMath } from "phaser";

export class InterpolatedMovementComponent extends Component {
  smoothing: number;
  snapDistance: number;
  private target: PhaserMath.Vector2 | null = null;

  constructor(gameObject: GameObjects.GameObject, smoothing: number = 0.2, snapDistance: number = 64) {
    super(gameObject);
    this.smoothing = smoothing;
    this.snapDistance = snapDistance;
  }

  update() {
    if (!this.target) {
      return;
    }
    const sprite = this.gameObject as Phaser.GameObjects.Sprite;
    const deltaX = this.target.x - sprite.x;
    const deltaY = this.target.y - sprite.y;

    if (Math.hypot(deltaX, deltaY) > this.snapDistance) {
      sprite.setPosition(this.target.x, this.target.y);
      return;
    }

    sprite.setPosition(
      PhaserMath.Linear(sprite.x, this.target.x, this.smoothing),
      PhaserMath.Linear(sprite.y, this.target.y, this.smoothing),
    );
  }
  setTarget(x: number, y: number) {
    if (!this.target) {
      this.target = new PhaserMath.Vector2(x, y);
    } else {
      this.target.set(x, y);
    }
  }
}
