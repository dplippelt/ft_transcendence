import type { GameObjects, Physics } from "phaser";
import Component from "./Component";
import type Player from "../gameobjects/Player";
import type { Enemy } from "../gameobjects/Enemy";

type PhysicsBody = Physics.Arcade.Body;

const INC_DYNAMIC_BODIES = true;
const EXC_STATIC_BODIES = false;

export class EnemySightSensor extends Component {
  private _physics: Physics.Arcade.ArcadePhysics;
  private _players: Player[];
  private _range: number;

  public set range(newRange: number) {
    if (newRange < 0) {
      throw new Error("Invalid range value");
    }
    this._range = newRange;
  }

  constructor(gameobject: GameObjects.GameObject) {
    super(gameobject);

    this._physics = gameobject.scene.physics;
    this._players = [];
    this._range = 1.0;
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
