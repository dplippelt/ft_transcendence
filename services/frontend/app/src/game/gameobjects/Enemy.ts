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

interface Range {
  minimum: number,
  maximum: number
}

export interface EnemyData {
  idleTime: Range,
  chaseDistance: Range,
  movementSpeed: Range, // min = walk, max = run
  states: EnemyStates,
}

type PhysicBody = Physics.Arcade.Body;

export class Enemy extends Physics.Arcade.Sprite {
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
    enemyData.states.idle = new IdleState(this, enemyData);
    enemyData.states.wander = new WanderState(this, enemyData);
    enemyData.states.chase = new ChaseState(this, enemyData);
    enemyData.states.recall = new RecallState(this, enemyData);
    this.fsm = new FiniteStateMachine(this, enemyData.states.idle);

    this.movement = new MovementComponent(this, enemyData.movementSpeed.maximum, input);
  }

  findNearbyPlayer(searchRadius: number): PhysicBody | undefined {
    const bodies = this.scene.physics.overlapCirc(this.x, this.y, searchRadius, true, false) as PhysicBody[];
    return bodies.find(body => body.gameObject.name === "player");
  }

}
