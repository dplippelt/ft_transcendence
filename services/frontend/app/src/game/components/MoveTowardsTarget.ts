import { GameObjects, Math, type Types } from "phaser";
import Component from "./Component";

type Vector2Like = Types.Math.Vector2Like;
type Target = GameObjects.GameObject | Types.Math.Vector2Like;
type FollowTarget = Target | null;

export class MoveTowardsTarget extends Component {
  private _target: FollowTarget;
  private _movementSpeed: number;
  private _stoppingDistance: number;
  private _targetReached: boolean;

  constructor(gameObject: GameObjects.GameObject, movementSpeed: number, stoppingDistance: number) {
    super(gameObject);

    this._target = null;
    this._movementSpeed = movementSpeed;
    this._stoppingDistance = stoppingDistance * stoppingDistance;
    this._targetReached = true;
  }

  private getPosition(target: Target): Vector2Like {
    if (target instanceof GameObjects.GameObject) {
      return target as unknown as { x: number; y: number };
    }
    return target as Vector2Like;
  }

  private isValidTarget(): boolean {
    if (this._target === null) {
      return false;
    }

    if (this._target instanceof GameObjects.GameObject) {
      return !this._target.isDestroyed && this._target.active;
    }

    return true;
  }

  setTarget(target: FollowTarget): void {
    this._target = target;
    this._targetReached = this._target === null;
  }

  isTargetReached(): boolean {
    return this._targetReached;
  }

  move(deltaTime: number): void {
    if (this._targetReached || !this.isValidTarget()) {
      return;
    }

    const targetPosition: Math.Vector2 = new Math.Vector2(this.getPosition(this._target!));
    const currentPosition: Vector2Like = this.getPosition(this.gameObject);
    const delta = targetPosition.subtract(currentPosition);
    if (delta.lengthSq() < this._stoppingDistance) {
      this._targetReached = true;
    }

    delta.normalize().scale(this._movementSpeed * (deltaTime / 1000.0));
    currentPosition.x += delta.x;
    currentPosition.y += delta.y;
  }
}
