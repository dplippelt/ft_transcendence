import { Scene } from "phaser";
import CardBase from "./CardBase";

export enum Operator {
    Plus = "+",
    Minus = "-",
    Multiply = "×",
    Divide = "/",
    Modulo = "mod",
};

export default class OperatorCard extends CardBase {

    constructor(scene: Scene, operator: Operator) {

        super(scene, operator);

        this.setDataEnabled();
        this.setData('operator', operator);

    }
}
