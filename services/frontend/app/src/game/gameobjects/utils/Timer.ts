import Phaser, { type Scene } from "phaser";
import type CombatManager from "../CombatManager";

export default class Timer {
  readonly config: Phaser.Types.Time.TimerEventConfig;
  readonly scene: Scene;
  readonly timerEvent: Phaser.Time.TimerEvent;
  readonly clock: Phaser.Time.Clock;

  constructor(
    scene: Scene,
    config: Phaser.Types.Time.TimerEventConfig,
    callback: Function,
    callbackScope: CombatManager,
  ) {
    config.callback = callback;
    config.callbackScope = callbackScope;
    this.config = config;
    this.scene = scene;
    this.clock = scene.time;
    this.timerEvent = new Phaser.Time.TimerEvent(this.config);
    this.clock.addEvent(this.timerEvent);
  }

  reset() {
    this.timerEvent.reset(this.config);
  }

  waitAndReset(msDelay: number) {
    this.scene.input.enabled = false;
    this.timerEvent.paused = true;
    this.clock.addEvent({
        delay: msDelay,
        callback: () => {
            this.scene.input.enabled = true
            this.timerEvent.paused = false;
            this.reset();
        },
        callbackScope: this,
    });


  }
}
