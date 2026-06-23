import Phaser, { Scene } from "phaser";
import { EventBus } from "../EventBus";

export default class TunnelScene extends Scene {
  constructor() {
    super("game");
  }

  create() {
    this.add.rectangle(20, 20, 120, 120, 0xFF00FF);

    const map: number[][] = [[]];
    map.fill([].fill(0, 0, 8), 0, 8);
    console.log("HELLO");
    console.log(map);

    EventBus.emit('current-scene-ready', this);
  }
}
