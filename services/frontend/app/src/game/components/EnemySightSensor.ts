import { GameObjects, Math, Physics, type Types } from "phaser";
import Component from "./Component";
import type Player from "../gameobjects/Player";
import type { Enemy } from "../gameobjects/Enemy";
import type { DungeonLocation } from "./DungeonLocation";

type PhysicsBody = Physics.Arcade.Body;
type Vector2Like = Types.Math.Vector2Like;

const INC_DYNAMIC_BODIES = true;
const EXC_STATIC_BODIES = false;

export class EnemySightSensor extends Component {
  private _physics: Physics.Arcade.ArcadePhysics;
  private _dungeonLocation: DungeonLocation;
  private _searchRadius: number;
  private _sightRadius: number;
  private _targetPlayer: Player | null;

  constructor(
    gameobject: GameObjects.GameObject,
    dungeonLocation: DungeonLocation,
    searchRadius: number,
    sightRadius: number,
  ) {
    super(gameobject);

    this._physics = gameobject.scene.physics;
    this._dungeonLocation = dungeonLocation;
    this._targetPlayer = null;
    this._searchRadius = searchRadius;
    this._sightRadius = sightRadius;
  }

  private playerIsWithinSightRange(): boolean {
    const position: Vector2Like = this.gameObject as unknown as { x: number; y: number };
    const targetPosition: Math.Vector2 = new Math.Vector2(this._targetPlayer as unknown as { x: number; y: number });
    return targetPosition.subtract(position).length() <= this._sightRadius;
  }

  private isValidTarget(): boolean {
    return this._targetPlayer !== null && !this._targetPlayer.inCombat && !this._targetPlayer.isDestroyed && this._targetPlayer.active;
  }

  searchForPlayer(): boolean {
    const enemyBody = this.gameObject as Enemy;
    const bodies: PhysicsBody[] = this._physics.overlapCirc(
      enemyBody.x,
      enemyBody.y,
      this._searchRadius,
      INC_DYNAMIC_BODIES,
      EXC_STATIC_BODIES,
    ) as PhysicsBody[];

    if (bodies.length === 0) {
      return false;
    }

    const playerBody = bodies.find((body) => body.gameObject.name === "player");
    if (playerBody === undefined) {
      return false;
    }

    const player = playerBody.gameObject as Player;
    if (!this._dungeonLocation.isTargetWithinRoom(player.dungeonLocation)) {
      return false;
    }
    this._targetPlayer = player;
    return true;
  }

  isPlayerInSight(): boolean {
    if (!this.isValidTarget()) {
      return false;
    }

    if (!this._dungeonLocation.isTargetWithinRoom(this._targetPlayer!.dungeonLocation)
      || !this.playerIsWithinSightRange()) {
      return false;
    }
    return true;
  }

  getPlayer(): Player | null {
    return this._targetPlayer;
  }
}
