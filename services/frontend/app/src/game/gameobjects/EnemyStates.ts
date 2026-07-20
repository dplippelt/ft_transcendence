import { Math } from "phaser";
import { Enemy, EnemyEvent, type EnemyData } from "./Enemy";
import { type IFiniteState } from "../components/FiniteStateMachine";
import { eventsCenter, GameEvents } from "../scenes/GameManagerScene";

abstract class EnemyState implements IFiniteState {
  enemy: Enemy;
  enemyData: EnemyData;

  constructor(enemy: Enemy, enemyData: EnemyData) {
    this.enemy = enemy;
    this.enemyData = enemyData;
  }

  abstract onUpdate(time: number, delta: number): IFiniteState | null;
}

export interface EnemyStates {
  idle: IFiniteState | null;
  wander: IFiniteState | null;
  chase: IFiniteState | null;
  recall: IFiniteState | null;
  combat: IFiniteState | null;
  die: IFiniteState | null;
}

// constructer (stateA, stateB, componentA, componentB, componentC...)

// state design pattern
// TODO: State behavior should be simple
//        actions() and decision()
//
// TODO: Sensor works for a single player, what if two were in range? enemy should switch targets and chase the other one

// TODO: What if the player forced the enemy outside the room?
export class IdleState extends EnemyState {
  onEnter(): void {
    this.enemy.sensor.range = this.enemyData.chaseDistance.minimum;
    this.enemy.waitFor.setWaitTime(Math.RND.between(this.enemyData.idleTime.minimum, this.enemyData.idleTime.maximum));
    // console.log(`Enter Idle State`);
  }

  onUpdate(time: number): IFiniteState | null {
    if (this.enemy.sensor.searchForPlayer()) {
      return this.enemyData.states.chase;
    }

    if (this.enemy.waitFor.isWaitOver(time)) {
      return this.enemyData.states.wander;
    }
    return null;
  }
}

export class WanderState extends EnemyState {
  onEnter(): void {
    const point = this.enemy.dungeonLocation.getRandomPositionInRoom();
    this.enemy.movement.setTarget(new Math.Vector2(point.x, point.y));
    this.enemy.sensor.range = this.enemyData.chaseDistance.minimum; // TODO: Move it into the sightSensor
    // console.log(`Enter Wander State towards ${this.target}`);
  }

  onUpdate(_time: number, delta: number): IFiniteState | null {
    if (this.enemy.sensor.searchForPlayer()) {
      return this.enemyData.states.chase;
    }

    if (this.enemy.movement.isTargetReached()) {
      return this.enemyData.states.idle;
    }

    this.enemy.movement.move(delta);
    return null;
  }

  onExit(): void {
    this.enemy.movement.setTarget(null);
  }
}

export class ChaseState extends EnemyState {
  constructor(enemy: Enemy, enemyData: EnemyData) {
    super(enemy, enemyData);
  }

  onEnter(): void {
    this.enemy.movement.setTarget(this.enemy.sensor.getPlayer());
    this.enemy.sensor.range = this.enemyData.chaseDistance.maximum;
    // console.log(`Enter Chase State towards ${this.player?.name}`);
  }

  onUpdate(_time: number, delta: number): IFiniteState | null {
    if (!this.enemy.sensor.isPlayerInSight()) {
      return this.enemyData.states.recall;
    }

    if (this.enemy.movement.isTargetReached()) {
      return this.enemyData.states.combat;
    }

    this.enemy.movement.move(delta);
    return null;
  }

  onExit(): void {
    this.enemy.movement.setTarget(null);
    this.enemy.sensor.range = this.enemyData.chaseDistance.minimum;
  }
}

export class RecallState extends EnemyState {
  onEnter() {
    this.enemy.movement.setTarget(this.enemyData.spawnPoint);
    // console.log(`Enter Recall State ...`);
  }

  onUpdate(_time: number, delta: number): IFiniteState | null {
    if (this.enemy.movement.isTargetReached()) {
      return this.enemyData.states.idle;
    }

    this.enemy.movement.move(delta);
    return null;
  }

  onExit(): void {
    this.enemy.movement.setTarget(null);
  }
}

export class CombatState extends EnemyState {
  combatOver: boolean; // TODO: Move to enemy...
  isPlayerDefeated: boolean;

  constructor(enemy: Enemy, enemyData: EnemyData) {
    super(enemy, enemyData);
    this.combatOver = false;
    this.isPlayerDefeated = false;
  }

  onEnter(): void {
    this.combatOver = false;
    this.enemy.once(EnemyEvent.CombatOver, (isPlayerDefeated: boolean) => {
      this.combatOver = true;
      this.isPlayerDefeated = isPlayerDefeated;
    });

    eventsCenter.emit(GameEvents.CombatInitiated, {
      player: this.enemy.sensor.getPlayer(),
      enemy: this.enemy,
      isPlayerDefeated: false,
      sceneInvoker: this.enemy.scene,
    });

    // console.log(`Enter ${this.enemy.name} Combat State...`);
  }

  onUpdate(): IFiniteState | null {
    if (!this.combatOver) {
      return null;
    }

    if (this.isPlayerDefeated) {
      return this.enemyData.states.idle; // TODO: Or DED :SADGE:
    }
    return this.enemyData.states.die;
  }
}

export class DieState extends EnemyState {
  onEnter(): void {
    this.enemy.destroy(false); // TODO: Better to de-activate and re-use the enemy
    // console.log(`Enter Die State ...`);
  }

  onUpdate(): IFiniteState | null {
    return null;
  }
}
