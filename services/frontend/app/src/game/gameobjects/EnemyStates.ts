import { Math } from "phaser";
import { Enemy, type EnemyData } from "./Enemy";
import { type IFiniteState } from "../components/FiniteStateMachine";
import type Player from "./Player";

interface EnemyState extends IFiniteState {
  enemy: Enemy;
  enemyData: EnemyData;
}

export interface EnemyStates {
  idle: IFiniteState | null;
  wander: IFiniteState | null;
  chase: IFiniteState | null;
  recall: IFiniteState | null;
}

export class IdleState implements EnemyState {
  enemy: Enemy;
  enemyData: EnemyData;
  waitFor: number;

  constructor(enemy: Enemy, enemyData: EnemyData) {
    this.enemy = enemy;
    this.enemyData = enemyData;
    this.waitFor = 0.0;
  }

  onEnter(): void {
    this.enemy.sensor.range = this.enemyData.chaseDistance.minimum;
    this.waitFor = Math.RND.between(this.enemyData.idleTime.minimum, this.enemyData.idleTime.maximum);

    console.log(`Enter Idle State for ${this.waitFor}`);
  }

  onUpdate(time: number, delta: number): IFiniteState | null {
    if (this.enemy.sensor.isPlayerInSight()) {
      return this.enemyData.states.chase;
    }

    // console.log(`${this.waitFor} - ${delta}; ${time}`);
    this.waitFor -= delta;
    if (this.waitFor > 0) {
      return null;
    }
    return this.enemyData.states.wander;
  }
}

export class WanderState implements EnemyState {
  enemy: Enemy;
  enemyData: EnemyData;
  target: Math.Vector2;

  constructor(enemy: Enemy, enemyData: EnemyData) {
    this.enemy = enemy;
    this.enemyData = enemyData;
    this.target = Math.Vector2.ZERO.clone();
  }

  onEnter(): void {
    // TODO: Wander on room tiles
    // Enemies are bound by the rooms
    // Enemies only wander inside the rooms
    this.target.x = Math.RND.between(0, 300);
    this.target.y = Math.RND.between(0, 300);

    console.log(`Enter Wander State towards ${this.target}`);
  }

  onUpdate(): IFiniteState | null {
    if (this.enemy.sensor.isPlayerInSight()) {
      return this.enemyData.states.chase;
    }

    const position = this.enemy.getWorldPoint();
    const direction = this.target.clone().subtract(position);
    if (direction.lengthSq() < 32.0) {
      return this.enemyData.states.idle;
    }

    direction.normalize();
    this.enemy.directionInput.setInputDirection(direction.x, direction.y);
    return null;
  }

  onExit(): void {
    this.enemy.directionInput.setInputDirection(0, 0);
  }
}

export class ChaseState implements EnemyState {
  enemy: Enemy;
  enemyData: EnemyData;
  player: Player | null;
  maxChaseDistanceSq: number;

  constructor(enemy: Enemy, enemyData: EnemyData) {
    this.enemy = enemy;
    this.enemyData = enemyData;
    this.player = null;
    this.maxChaseDistanceSq = 0.0;
  }

  onEnter(): void {
    this.player = this.enemy.sensor.getPlayer();
    this.maxChaseDistanceSq = this.enemyData.chaseDistance.maximum * this.enemyData.chaseDistance.maximum;

    console.log(`Enter Chase State towards ${this.player?.name}`);
  }

  // Enemies can chase outside the rooms, but will wander back once the target is out of range
  // Enemies have a maximum chase range
  onUpdate(): IFiniteState | null {
    if (this.player === null || this.player.isDestroyed || !this.player.active) {
      return this.enemyData.states.recall;
    }

    const delta = this.player.getWorldPoint().subtract(this.enemy.getWorldPoint());
    if (delta.lengthSq() > this.maxChaseDistanceSq) {
      return this.enemyData.states.recall;
    }

    if (delta.lengthSq() < 16.0) {
      // TODO: Invoke Combat - Combat State => Death State V Recall State
      return this.enemyData.states.idle;
    }

    delta.normalize();
    this.enemy.directionInput.setInputDirection(delta.x, delta.y);
    return null;
  }

  onExit(): void {
    this.player = null;
    this.enemy.directionInput.setInputDirection(0, 0);
  }
}

export class RecallState implements EnemyState {
  enemy: Enemy;
  enemyData: EnemyData;

  constructor(enemy: Enemy, enemyData: EnemyData) {
    this.enemy = enemy;
    this.enemyData = enemyData;

    console.log(`Enter Recall State ...`);
  }

  onEnter() {
    // path towards room
  }

  onUpdate(): IFiniteState | null {
    // range check and move back towards room
    //
    // if inside room => back to idle or wander
    //

    const position = this.enemy.getWorldPoint();
    const direction = this.enemyData.spawnPoint.clone().subtract(position);
    if (direction.lengthSq() < 32.0) {
      return this.enemyData.states.idle;
    }

    direction.normalize();
    this.enemy.directionInput.setInputDirection(direction.x, direction.y);
    return null;
  }

  onExit(): void {
    this.enemy.directionInput.setInputDirection(0, 0);
  }
}
