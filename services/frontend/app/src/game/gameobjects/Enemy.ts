// Enemies are bound by the rooms
// Enemies only wander inside the rooms
// Enemies can chase outside the rooms, but will wander back once the target is out of range
// Enemies have a maximum chase range
//
// Finite State Machine
//
// Idle -> Wander
// Idle -> Chase
// Wander -> Chase
// Wander -> Idle
// Chase -> Idle
// Chase -> Wander
// Chase -> Recall
//
// Recall -> Chase
// Recall -> Idle

import { Scene, Physics } from "phaser";
import { type IFiniteState } from "../components/FiniteStateMachine";
import { AssetsKey } from "../Assets";
import { FiniteStateMachine } from "../components/FiniteStateMachine";

interface Range {
  minimum: number,
  maximum: number
}

abstract class EnemyState implements IFiniteState {
  abstract enemyData: EnemyData;
  // reference to body?
  // the ai logic is within the states
}

class IdleState implements EnemyState {
  enemyData: EnemyData;

  constructor(enemyData: EnemyData) {
    this.enemyData = enemyData;
    this.enemyData.states.idle = this;
  }

  onUpdate(): IFiniteState | null {
    return this.enemyData.states.wander;
  }
}

class WanderState implements EnemyState {
  enemyData: EnemyData;

  constructor(enemyData: EnemyData) {
    this.enemyData = enemyData;
    this.enemyData.states.wander = this;
  }

  onEnter(): void {
    // choose tile
  }

  onUpdate(): IFiniteState | null {
    // move towards tile
    return null;
  }
}

class ChaseState implements EnemyState {
  enemyData: EnemyData;

  constructor(enemyData: EnemyData) {
    this.enemyData = enemyData;
    this.enemyData.states.chase = this;
  }

  onUpdate(): IFiniteState | null {
    // range check and move towards target
    return null;
  }

  onExit(): void {
    // clear target
  }
}

interface EnemyStates {
  idle: IFiniteState;
  wander: IFiniteState;
  chase: IFiniteState;
  recall: IFiniteState;
}

interface EnemyData {
  idleTime: Range,
  chaseDistance: Range,
  movementSpeed: Range, // min = walk, max = run
  states: EnemyStates
}

class Enemy extends Physics.Arcade.Sprite {
  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, AssetsKey.Skeleton); // TODO: EnemyData for specifics

    const enemyData: EnemyData = {
      idleTime: { minimum: 3, maximum: 5 },
      chaseDistance: { minimum: 5, maximum: 9 },
      movementSpeed: { minimum: 2, maximum: 4 },
      states: {}
    };
    // Setup up the FSM
    const fsm = new FiniteStateMachine(this, new IdleState(enemyData));
  }
}
