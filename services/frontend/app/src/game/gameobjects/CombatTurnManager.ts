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
  readonly timerText: Phaser.GameObjects.Text;

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
    EventBus.emit(CombatEvent.initTurnTimer, this.playerDelayMs);
    this.enemyTimer = null;
    this.timerText = this.scene.add.text(100, 200, "timer");
  }

  switchTurn() {
    this.isPlayerTurn = !this.isPlayerTurn;

    if (this.isPlayerTurn) {
      this.scene.input.enabled = true;

      if (this.playerTimer) {
        this.playerTimer.remove();
      }
      if (this.enemyTimer) {
        this.enemyTimer.remove();
      }

      this.playerTimer = this.playTurnFor(this.playerDelayMs);
      this.turnEvents.emit(TurnEvents.STARTPLAYER);
      EventBus.emit(CombatEvent.initTurnTimer, this.turnConfig.playerDelayMs);
    } else {
      this.pausePlayerTurn();

      if (this.enemyTimer) {
        this.enemyTimer.remove();
      }

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

  // TODO: for debugging/testing only - remove later
  displayTimer() {
    const output: string[] = [];
    if (this.enemyTimer) {
      output.push("Enemy time: " + this.enemyTimer.getRemaining().toString());
    }
    this.timerText.setText(output);
  }
}
