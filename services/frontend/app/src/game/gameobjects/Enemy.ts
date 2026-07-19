import { Scene, Physics, Math } from "phaser";
import { AssetsKey } from "../Assets";
import { FiniteStateMachine } from "../components/FiniteStateMachine";
import MovementComponent from "../components/MovementComponent";
import {
  IdleState,
  WanderState,
  ChaseState,
  RecallState,
  type EnemyStates,
  CombatState,
  DieState,
} from "./EnemyStates";
import { EnemyInput } from "../components/EnemyInput";
import { EnemySightSensor } from "../components/EnemySightSensor";
import type { Dungeon } from "./Dungeon";
import { DungeonLocation } from "../components/DungeonLocation";
import type { Room } from "../map/procedural";

interface Range {
  minimum: number;
  maximum: number;
}

export interface EnemyData {
  spawnPoint: Math.Vector2;
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
  dungeonLocation: DungeonLocation;

  private static counter: number = 0;

  constructor(scene: Scene, x: number, y: number, room: Room, dungeon: Dungeon) {
    super(scene, x, y, AssetsKey.Skeleton); // TODO: EnemyData for specifics

    const enemyData: EnemyData = {
      spawnPoint: new Math.Vector2(x, y),
      idleTime: { minimum: 3000, maximum: 5000 },
      chaseDistance: { minimum: 64, maximum: 128 },
      movementSpeed: { minimum: 120, maximum: 190 },
      states: {
        idle: null,
        wander: null,
        chase: null,
        recall: null,
        combat: null,
        die: null,
      },
    };

    this.sensor = new EnemySightSensor(this);
    this.dungeonLocation = new DungeonLocation(this, room, dungeon);

    // Setup up the FSM
    enemyData.states.idle = new IdleState(this, enemyData);
    enemyData.states.wander = new WanderState(this, enemyData);
    enemyData.states.chase = new ChaseState(this, enemyData);
    enemyData.states.recall = new RecallState(this, enemyData);
    enemyData.states.combat = new CombatState(this, enemyData);
    enemyData.states.die = new DieState(this, enemyData);
    this.fsm = new FiniteStateMachine(this, enemyData.states.idle);

    this.directionInput = new EnemyInput();
    this.movement = new MovementComponent(this, enemyData.movementSpeed.maximum, this.directionInput);

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);

    this.name = String(Enemy.counter++);
    console.log(`Constructed ${this.name}`);
  }

  IsPlayerInSight(): boolean {
    const player = this.sensor.getPlayer();
    return player !== null && !player.isInCombat && this.dungeonLocation.isTargetWithinRoom(player.dungeonLocation);
  }
}
