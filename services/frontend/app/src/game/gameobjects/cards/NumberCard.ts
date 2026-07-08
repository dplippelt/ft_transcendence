import { Scene } from "phaser";
import CardBase from "./CardBase";

export default class NumberCard extends CardBase {
  constructor(scene: Scene, num: number) {
    super(scene, num.toString());

    this.setDataEnabled();
    this.setData("number", num);
  }
}
