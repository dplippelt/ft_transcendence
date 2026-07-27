import Phaser, { type Scene } from "phaser";
import type CombatManager from "./CombatManager";

interface TurnConfig {
  playerDelayMs: number;
  enemyDelayMs: number;
}

const turnCOnfig: TurnConfig = {
  playerDelayMs: 10000,
  enemyDelayMs: 5000,
};

const timeConfig: Phaser.Types.Time.TimerEventConfig = {
  delay: 10000,
  loop: true,
};

enum TurnEvents {
  SWITCH = "switch",
}

export default class CombatTimeManager {
  readonly combatManager: CombatManager;
  readonly scene: Scene;
  readonly clock: Phaser.Time.Clock;
  readonly turnConfig: TurnConfig = turnCOnfig;
  private turnSwitcher: Phaser.Events.EventEmitter;
  private isPlayerTurn: boolean;
  private playerTimer: Phaser.Time.TimerEvent | null;
  private enemyTimer: Phaser.Time.TimerEvent | null;
  readonly timerText: Phaser.GameObjects.Text;

  constructor(combatManager: CombatManager) {
    this.combatManager = combatManager;
    this.scene = combatManager.scene;
    this.clock = this.scene.time;
    this.turnSwitcher = new Phaser.Events.EventEmitter();
    this.turnSwitcher.on(TurnEvents.SWITCH, this.switchTurn, this);
    this.isPlayerTurn = true;
    this.playerTimer = this.playNextTurnFor(this.turnConfig.playerDelayMs);

    // To display, not necessary.
    this.enemyTimer = null;
    this.timerText = this.scene.add.text(300, 300, "timer");
  }

  switchTurn() {
    this.isPlayerTurn = !this.isPlayerTurn;
    if (this.isPlayerTurn) {
      this.scene.input.enabled = true;
      this.playerTimer?.remove();
      this.playerTimer = this.playNextTurnFor(this.turnConfig.playerDelayMs);
    } else {
      this.scene.input.enabled = false;
      if (this.playerTimer) {
        this.playerTimer.paused = true;
      }
      this.enemyTimer?.remove();
      this.enemyTimer = this.playNextTurnFor(this.turnConfig.enemyDelayMs);
      this.combatManager.executeEnemyEffect();
    }
  }

  playNextTurnFor(ms: number) {
    const config: Phaser.Types.Time.TimerEventConfig = {
      delay: ms,
      callback: () => {
        this.turnSwitcher.emit(TurnEvents.SWITCH);
      },
      callbackScope: this,
    };
    return this.clock.addEvent(config);
  }

  displayTimer() {
    const output: string[] = [];
    if (this.playerTimer) {
      output.push("Player time: " + this.playerTimer.getRemaining().toString());
    }
    if (this.enemyTimer) {
      output.push("Enemy time" + this.enemyTimer.getRemaining().toString());
    }
    this.timerText.setText(output);
  }
}
