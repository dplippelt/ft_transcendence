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

import { Scene, Physics, Math as pMath } from "phaser";
import { type IFiniteState } from "../components/FiniteStateMachine";
import { AssetsKey } from "../Assets";
import { FiniteStateMachine } from "../components/FiniteStateMachine";
import type IPlayerInput from "../components/IPlayerInput";
import MovementComponent from "../components/MovementComponent";

interface Range {
  minimum: number,
  maximum: number
}

interface EnemyState extends IFiniteState {
  enemyData: EnemyData;
  // reference to body?
  // the ai logic is within the states
}

class IdleState implements EnemyState {
  enemyData: EnemyData;

  constructor(enemyData: EnemyData) {
    this.enemyData = enemyData;
  }

  onEnter(): void {
    // randomize wait time
  }

  onUpdate(): IFiniteState | null {
    return this.enemyData.states.wander;
  }
}

class WanderState implements EnemyState {
  enemyData: EnemyData;

  constructor(enemyData: EnemyData) {
    this.enemyData = enemyData;
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
  }

  onUpdate(): IFiniteState | null {
    // range check and move towards target
    return null;
  }

  onExit(): void {
    // clear target
  }
}

class RecallState implements EnemyState {
  enemyData: EnemyData;

  constructor(enemyData: EnemyData) {
    this.enemyData = enemyData;
  }

  onEnter() {
    // path towards room
  }

  onUpdate(): IFiniteState | null {
    // range check and move back towards room
    return null;
  }
}

interface EnemyStates {
  idle: IFiniteState | null;
  wander: IFiniteState | null;
  chase: IFiniteState | null;
  recall: IFiniteState | null;
}

interface EnemyData {
  idleTime: Range,
  chaseDistance: Range,
  movementSpeed: Range, // min = walk, max = run
  states: EnemyStates
}

class EnemyInput implements IPlayerInput {
  direction: pMath.Vector2;
  action: boolean;

  constructor() {
    this.direction = pMath.Vector2.ZERO.clone();
    this.action = false;
  }

  setInputDirection(x: number, y: number): void {
    this.direction.x = x;
    this.direction.y = y;
  }

  getInputDirection(): pMath.Vector2 {
    return this.direction;
  }

  getInteraction(): boolean {
    return this.action;
  }
}

class Enemy extends Physics.Arcade.Sprite {
  fsm: FiniteStateMachine;
  movement: MovementComponent;

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, AssetsKey.Skeleton); // TODO: EnemyData for specifics

    const enemyData: EnemyData = {
      idleTime: { minimum: 3, maximum: 5 },
      chaseDistance: { minimum: 5, maximum: 9 },
      movementSpeed: { minimum: 2, maximum: 4 },
      states: {
        idle: null,
        wander: null,
        chase: null,
        recall: null
      }
    };

    const input = new EnemyInput();

    // Setup up the FSM
    enemyData.states.idle = new IdleState(enemyData);
    enemyData.states.wander = new WanderState(enemyData);
    enemyData.states.chase = new ChaseState(enemyData);
    enemyData.states.recall = new RecallState(enemyData);
    this.fsm = new FiniteStateMachine(this, enemyData.states.idle);

    this.movement = new MovementComponent(this, enemyData.movementSpeed.maximum, input);
  }
}
