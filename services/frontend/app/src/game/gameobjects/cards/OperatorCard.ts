import { Scene } from "phaser";
import CardBase from "./CardBase";

export enum Operator {
  Plus = "+",
  Minus = "-",
  Multiply = "×",
  Divide = "/",
  Modulo = "mod",
}

export default class OperatorCard extends CardBase {

    constructor(scene: Scene, private operator: Operator) {

        super(scene, operator);

        this.setValue(operator);
        // this.setDataEnabled();
        // this.setData('operator', operator);

    }

}
