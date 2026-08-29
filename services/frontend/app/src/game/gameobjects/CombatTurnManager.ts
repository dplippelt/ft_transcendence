import Phaser, { type Scene } from "phaser";
import type CombatManager from "./CombatManager";
import { EventBus } from "../EventBus";
import { CombatEvent } from "../../utils/utils";

export enum TurnEvents {
  SWITCH = "switch",
  STARTPLAYER = "startPlayer",
  STARTENEMY = "startEnemy",
}

export default class CombatTurnManager {
  readonly combatManager: CombatManager;
  readonly scene: Scene;
  readonly clock: Phaser.Time.Clock;
  readonly turnEvents: Phaser.Events.EventEmitter;
  readonly playerDelayMs: number;
  readonly enemyDelayMs: number;
  private isPlayerTurn: boolean;
  private playerTimer: Phaser.Time.TimerEvent | null;
  // The enemy timer allows CombatTurnManager to switch turns by itself, without relying on CombatManager to explicitly trigger the switch.
  // Currently, CombatManager normally triggers the switch before the enemy timer runs out,
  // but the timer is kept to minimize the dependency between the two components.
  private enemyTimer: Phaser.Time.TimerEvent | null;

  constructor(combatManager: CombatManager) {
    this.combatManager = combatManager;
    this.scene = combatManager.scene;
    this.clock = this.scene.time;
    this.turnEvents = new Phaser.Events.EventEmitter();
    this.turnEvents.on(TurnEvents.SWITCH, this.switchTurn, this);
    this.playerDelayMs = 10000;
    this.enemyDelayMs = 5000;
    this.isPlayerTurn = true;
    this.playerTimer = this.playTurnFor(this.playerDelayMs);
    this.enemyTimer = null;
    EventBus.addListener(CombatEvent.getTurnTimerState, this.sendElapsedTime, this)
  }

  destroy() {
    this.cleanupTimers();
    EventBus.removeListener(CombatEvent.getTurnTimerState, this.sendElapsedTime, this)
  }

  cleanupTimers() {
    if (this.playerTimer) {
      this.playerTimer.remove();
    }
    if (this.enemyTimer) {
      this.enemyTimer.remove();
    }
  }

  switchTurn() {
    this.isPlayerTurn = !this.isPlayerTurn;

    if (this.isPlayerTurn) {
      this.scene.input.enabled = true;
      this.cleanupTimers();
      this.playerTimer = this.playTurnFor(this.playerDelayMs);
      this.turnEvents.emit(TurnEvents.STARTPLAYER);
    } else {
      this.scene.input.enabled = false;
      this.cleanupTimers();
      this.enemyTimer = this.playTurnFor(this.enemyDelayMs);
      this.turnEvents.emit(TurnEvents.STARTENEMY);
    }
  }

  playTurnFor(ms: number) {
    const config: Phaser.Types.Time.TimerEventConfig = {
      delay: ms,
      callback: () => {
        this.turnEvents.emit(TurnEvents.SWITCH);
      },
      callbackScope: this,
    };
    return this.clock.addEvent(config);
  }

  pausePlayerTurn() {
    this.scene.input.enabled = false;
    if (this.playerTimer) {
      this.playerTimer.paused = true;
    }
  }

  unpausePlayerTurn() {
    this.scene.input.enabled = true;
    if (this.playerTimer) {
      this.playerTimer.paused = false;
    }
  }

  sendElapsedTime() {
    const timer = this.isPlayerTurn ? this.playerTimer : null;
    if (!timer)
      return null;
    EventBus.emit(CombatEvent.initTurnTimer, this.playerDelayMs, timer.getElapsed());
  }

  getIsPlayerTurn() {
    return this.isPlayerTurn;
  }

  getPlayerDelayMs() {
    return this.playerDelayMs;
  }
}
