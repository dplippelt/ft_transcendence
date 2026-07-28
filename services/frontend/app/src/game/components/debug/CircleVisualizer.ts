import Component from "../Component";
import { Physics, GameObjects } from "phaser";

export class CircleVisualizer extends Component {
  body: Physics.Arcade.Sprite;
  circle: GameObjects.Arc;

  constructor(gameObject: GameObjects.GameObject, radius: number, color: number) {
    super(gameObject);

    this.body = gameObject as Physics.Arcade.Sprite;
    this.circle = gameObject.scene.add.circle(this.body.x, this.body.y, radius, color, 200);
  }

  update(): void {
    this.circle.setX(this.body.x);
    this.circle.setY(this.body.y);
  }

  destroy(): void {
    super.destroy();
    this.circle.destroy();
  }
}
