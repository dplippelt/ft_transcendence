import type { GameObjects, Physics } from "phaser";
import Component from "./Component";
import type Player from "../gameobjects/Player";
import type { Enemy } from "../gameobjects/Enemy";

type PhysicsBody = Physics.Arcade.Body;

const INC_DYNAMIC_BODIES = true;
const EXC_STATIC_BODIES = false;

class CircleVisualizer extends Component {
  body: Physics.Arcade.Sprite;
  circle: GameObjects.Arc;

  constructor(gameObject: GameObjects.GameObject, radius: number) {
    super(gameObject);

    this.body = gameObject as Physics.Arcade.Sprite;
    this.circle = gameObject.scene.add.circle(this.body.x, this.body.y, radius, 0xFF0000, 200);
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

export class EnemySightSensor extends Component {
  private _physics: Physics.Arcade.ArcadePhysics;
  private _players: Player[];
  private _range: number;
  private _rangeVisualizer;

  public set range(newRange: number) {
    if (newRange < 0) {
      throw new Error("Invalid range value");
    }
    this._range = newRange;
    this._rangeVisualizer.circle.setRadius(newRange);
  }

  constructor(gameobject: GameObjects.GameObject) {
    super(gameobject);

    this._physics = gameobject.scene.physics;
    this._players = [];
    this._range = 1.0;

    this._rangeVisualizer = new CircleVisualizer(gameobject, this._range);
  }

  update(): void {
    if (this._players.length > 0) {
      this._players = [];
    }

    const enemyBody = this.gameObject as Enemy;
    const bodies: PhysicsBody[] = this._physics.overlapCirc(
      enemyBody.x, enemyBody.y,
      this._range,
      INC_DYNAMIC_BODIES, EXC_STATIC_BODIES,
    ) as PhysicsBody[];
    if (bodies.length === 0) {
      return;
    }

    for (const body of bodies) {
      if (body.gameObject.name === "player") {
        this._players.push(body.gameObject as Player);
      }
    }
  }

  isPlayerInSight(): boolean {
    return this._players.length > 0;
  }

  getPlayer(): Player | null {
    if (this.isPlayerInSight()) {
      return this._players[0];
    }
    return null;
  }
}
