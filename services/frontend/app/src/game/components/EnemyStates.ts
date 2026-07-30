import { Math } from "phaser";
import { Enemy } from "../gameobjects/Enemy";
import { type IFiniteState, type NextState } from "../components/FiniteStateMachine";
import { GameEvents, GameManagerScene } from "../scenes/GameManagerScene";

export interface EnemyStates {
  idle: IFiniteState<Enemy>;
  wander: IFiniteState<Enemy>;
  chase: IFiniteState<Enemy>;
  recall: IFiniteState<Enemy>;
  combat: IFiniteState<Enemy>;
  die: IFiniteState<Enemy>;
}

export class IdleState implements IFiniteState<Enemy> {
  private randomIdleTime(enemy: Enemy): number {
    return Math.RND.between(enemy.enemyData.idleTime.minimum, enemy.enemyData.idleTime.maximum);
  }

  onEnter(enemy: Enemy): void {
    enemy.waitFor.setWaitTime(this.randomIdleTime(enemy));
  }

  onUpdate(enemy: Enemy, time: number): NextState<Enemy> {
    if (enemy.sensor.searchForPlayer()) {
      return enemy.enemyData.states.chase;
    }

    if (enemy.waitFor.isWaitOver(time)) {
      return enemy.enemyData.states.wander;
    }
    return null;
  }
}

export class WanderState implements IFiniteState<Enemy> {
  onEnter(enemy: Enemy): void {
    const point = enemy.dungeonLocation.getRandomPositionInRoom();
    enemy.movement.setTarget(new Math.Vector2(point.x, point.y));
  }

  onUpdate(enemy: Enemy, _time: number, delta: number): NextState<Enemy> {
    if (enemy.sensor.searchForPlayer()) {
      return enemy.enemyData.states.chase;
    }

    if (enemy.movement.isTargetReached()) {
      return enemy.enemyData.states.idle;
    }

    enemy.movement.move(delta);
    return null;
  }

  onExit(enemy: Enemy): void {
    enemy.movement.setTarget(null);
  }
}

export class ChaseState implements IFiniteState<Enemy> {
  onEnter(enemy: Enemy): void {
    enemy.movement.setTarget(enemy.sensor.getPlayer());
  }

  onUpdate(enemy: Enemy, _time: number, delta: number): NextState<Enemy> {
    if (!enemy.sensor.isPlayerInSight()) {
      return enemy.enemyData.states.recall;
    }

    if (enemy.movement.isTargetReached()) {
      return enemy.enemyData.states.combat;
    }

    enemy.movement.move(delta);
    return null;
  }

  onExit(enemy: Enemy): void {
    enemy.movement.setTarget(null);
  }
}

export class RecallState implements IFiniteState<Enemy> {
  onEnter(enemy: Enemy) {
    enemy.movement.setTarget(enemy.spawn.spawnPoint);
  }

  onUpdate(enemy: Enemy, _time: number, delta: number): NextState<Enemy> {
    if (enemy.movement.isTargetReached()) {
      return enemy.enemyData.states.idle;
    }

    enemy.movement.move(delta);
    return null;
  }

  onExit(enemy: Enemy): void {
    enemy.movement.setTarget(null);
  }
}

export class CombatState implements IFiniteState<Enemy> {
  onEnter(enemy: Enemy): void {
    const player = enemy.sensor.getPlayer();
    if (player === null) {
      throw new Error('Player cannot null when entering the combat state');
    }

    // BUG: Player can engage in multiple combats because inCombat flag is set at next update
    GameManagerScene.EventsCenter.emit(GameEvents.CombatInitiated, {
      player: player,
      enemy: enemy,
      sceneInvoker: enemy.scene,
    });
  }

  onUpdate(enemy: Enemy): NextState<Enemy> {
    if (enemy.inCombat) {
      return null;
    }

    if (enemy.isAlive) {
      return enemy.enemyData.states.recall;
    }
    return enemy.enemyData.states.die;
  }

  onExit(enemy: Enemy): void {
    enemy.movement.setTarget(null);
    enemy.sensor.clearTarget();
  }
}

export class DieState implements IFiniteState<Enemy> {
  onEnter(enemy: Enemy): void {
    enemy.destroy(false);
  }

  onUpdate(): NextState<Enemy> {
    return null;
  }
}
