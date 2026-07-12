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
import { AssetsKey } from "../Assets";
import { FiniteStateMachine } from "../components/FiniteStateMachine";
import MovementComponent from "../components/MovementComponent";
import { IdleState, WanderState, ChaseState, RecallState, type EnemyStates } from "./EnemyStates";
import { EnemyInput } from "../components/EnemyInput";
import { EnemySightSensor } from "../components/EnemySightSensor";

interface Range {
  minimum: number;
  maximum: number;
}

export interface EnemyData {
  idleTime: Range;
  chaseDistance: Range;
  movementSpeed: Range; // min = walk, max = run
  states: EnemyStates;
}

export class Enemy extends Physics.Arcade.Sprite {
  fsm: FiniteStateMachine;
  movement: MovementComponent;
  sensor: EnemySightSensor;
  directionInput: EnemyInput;

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, AssetsKey.Skeleton); // TODO: EnemyData for specifics

    const enemyData: EnemyData = {
      idleTime: { minimum: 3000, maximum: 5000 },
      chaseDistance: { minimum: 160, maximum: 288 },
      movementSpeed: { minimum: 120, maximum: 190 },
      states: {
        idle: null,
        wander: null,
        chase: null,
        recall: null,
      },
    };

    this.sensor = new EnemySightSensor(this);

    // Setup up the FSM
    enemyData.states.idle = new IdleState(this, enemyData);
    enemyData.states.wander = new WanderState(this, enemyData);
    enemyData.states.chase = new ChaseState(this, enemyData);
    enemyData.states.recall = new RecallState(this, enemyData);
    this.fsm = new FiniteStateMachine(this, enemyData.states.idle);

    this.directionInput = new EnemyInput();
    this.movement = new MovementComponent(this, enemyData.movementSpeed.maximum, this.directionInput);
  }
}
