import type { GameObjects } from "phaser";
import Component from "./Component";

export class WaitFor extends Component {
  private _waitTime: number;

  constructor(gameObject: GameObjects.GameObject) {
    super(gameObject);

    this._waitTime = 0;
  }

  setWaitTime(duration: number) {
    this._waitTime = this.gameObject.scene.time.now + duration;
  }

  isWaitOver(currentTime: number) {
    return currentTime >= this._waitTime;
  }
}
