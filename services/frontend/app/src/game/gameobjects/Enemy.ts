import { Scene, Physics } from "phaser";
import { AssetsKey } from "../Assets";
import { FiniteStateMachine } from "../components/FiniteStateMachine";
import {
  IdleState,
  WanderState,
  ChaseState,
  RecallState,
  type EnemyStates,
  CombatState,
  DieState,
} from "./EnemyStates";
import { EnemySightSensor } from "../components/EnemySightSensor";
import { type SpawnLocation } from "./Dungeon";
import { DungeonLocation } from "../components/DungeonLocation";
import { WaitFor } from "../components/WaitFor";
import { MoveTowardsTarget } from "../components/MoveTowardsTarget";

interface Range {
  minimum: number;
  maximum: number;
}

export interface EnemyData {
  assetKey: AssetsKey;
  idleTime: Range;
  chaseDistance: Range;
  movementSpeed: Range;
  states: EnemyStates;
}

export enum EnemyEvent {
  CombatOver = "combat-over",
}

export class Enemy extends Physics.Arcade.Sprite {
  fsm: FiniteStateMachine<Enemy>;
  waitFor: WaitFor;
  movement: MoveTowardsTarget;
  sensor: EnemySightSensor;
  dungeonLocation: DungeonLocation;
  inCombat: boolean;
  isAlive: boolean;
  readonly enemyData: EnemyData;
  readonly spawn: SpawnLocation;

  constructor(scene: Scene, spawnLocation: SpawnLocation, enemyData: EnemyData) {
    super(scene, spawnLocation.spawnPoint.x, spawnLocation.spawnPoint.y, enemyData.assetKey);

    this.enemyData = enemyData;
    this.spawn = spawnLocation;
    this.inCombat = false;
    this.isAlive = true;
    this.waitFor = new WaitFor(this);
    this.movement = new MoveTowardsTarget(this, enemyData.movementSpeed.maximum, 8);
    this.dungeonLocation = new DungeonLocation(this, spawnLocation.startingRoom, spawnLocation.dungeon);
    this.sensor = new EnemySightSensor(this, this.dungeonLocation, 64, 128);
    this.fsm = new FiniteStateMachine(this, enemyData.states.idle);

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
  }
}

const skeletonData: EnemyData = {
  assetKey: AssetsKey.Skeleton,
  idleTime: { minimum: 3000, maximum: 5000 },
  chaseDistance: { minimum: 64, maximum: 128 },
  movementSpeed: { minimum: 120, maximum: 190 },
  states: {
    idle: new IdleState(),
    wander: new WanderState(),
    chase: new ChaseState(),
    recall: new RecallState(),
    combat: new CombatState(),
    die: new DieState(),
  },
};

export function createSkeletonEnemy(scene: Scene, spawnLocation: SpawnLocation): Enemy {
  return new Enemy(scene, spawnLocation, skeletonData);
}
