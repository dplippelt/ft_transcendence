import Phaser, { type Scene } from "phaser";
import type CombatManager from "../CombatManager";

export default class Timer {
  readonly config: Phaser.Types.Time.TimerEventConfig;
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
    this.clock = scene.time;
    this.timerEvent = new Phaser.Time.TimerEvent(this.config);
    this.clock.addEvent(this.timerEvent);
  }

  reset() {
    this.timerEvent.reset(this.config);
  }
}
