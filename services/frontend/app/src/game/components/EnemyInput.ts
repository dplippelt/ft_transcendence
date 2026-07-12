import type IPlayerInput from "./IPlayerInput";
import { Math } from "phaser";

type Vector2 = Math.Vector2;

export class EnemyInput implements IPlayerInput {
  direction: Vector2;
  action: boolean;

  constructor() {
    this.direction = Math.Vector2.ZERO.clone();
    this.action = false;
  }

  setInputDirection(x: number, y: number): void {
    this.direction.x = x;
    this.direction.y = y;
  }

  setInteraction(val: boolean): void {
    this.action = val;
  }

  getInputDirection(): Vector2 {
    return this.direction;
  }

  getInteraction(): boolean {
    return this.action;
  }
}
