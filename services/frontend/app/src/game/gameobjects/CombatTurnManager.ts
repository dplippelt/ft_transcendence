import Phaser, { type Scene } from "phaser";
import type CombatManager from "./CombatManager";
import { EventBus } from "../EventBus";
import { CombatEvent } from "../../utils/utils";

interface TurnConfig {
  playerDelayMs: number;
  enemyDelayMs: number;
}

const turnConfig: TurnConfig = {
  playerDelayMs: 5000, // TODO: change back to intended player turn dur (was 10000)
  enemyDelayMs: 1000,
};

export enum TurnEvents {
  SWITCH = "switch",
  STARTPLAYER = "startPlayer",
  STARTENEMY = "startEnemy",
}

export default class CombatTurnManager {
  readonly combatManager: CombatManager;
  readonly scene: Scene;
  readonly clock: Phaser.Time.Clock;
  readonly turnConfig: TurnConfig = turnConfig;
  readonly turnEvents: Phaser.Events.EventEmitter;
  private isPlayerTurn: boolean;
  private playerTimer: Phaser.Time.TimerEvent | null;
  private enemyTimer: Phaser.Time.TimerEvent | null;
  readonly timerText: Phaser.GameObjects.Text;

  constructor(combatManager: CombatManager) {
    this.combatManager = combatManager;
    this.scene = combatManager.scene;
    this.clock = this.scene.time;
    this.turnEvents = new Phaser.Events.EventEmitter();
    this.turnEvents.on(TurnEvents.SWITCH, this.switchTurn, this);
    this.isPlayerTurn = true;
    this.playerTimer = this.playTurnFor(this.turnConfig.playerDelayMs);
    EventBus.emit(CombatEvent.initTurnTimer, this.turnConfig.playerDelayMs);

    // To display, not necessary.
    this.enemyTimer = null;
    this.timerText = this.scene.add.text(500, 200, "timer");
  }

  switchTurn() {
    this.isPlayerTurn = !this.isPlayerTurn;

    if (this.isPlayerTurn) {
      this.scene.input.enabled = true;

      if (this.playerTimer) {
        this.playerTimer.remove();
      }

      this.playerTimer = this.playTurnFor(this.turnConfig.playerDelayMs);
      this.turnEvents.emit(TurnEvents.STARTPLAYER);
      EventBus.emit(CombatEvent.initTurnTimer, this.turnConfig.playerDelayMs);
    } else {
      this.scene.input.enabled = false;

      if (this.playerTimer) {
        this.playerTimer.paused = true;
      }

      // To display, not necessary.
      this.enemyTimer?.remove();
      this.enemyTimer = this.playTurnFor(this.turnConfig.enemyDelayMs);
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

  // TODO: for debugging/testing only - remove later
  displayTimer() {
    const output: string[] = [];
    if (this.enemyTimer) {
      output.push("Enemy time: " + this.enemyTimer.getRemaining().toString());
    }
    this.timerText.setText(output);
  }
}
