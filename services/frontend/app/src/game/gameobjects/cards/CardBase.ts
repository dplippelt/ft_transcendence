import { Scene } from "phaser";
import BoxedText from "../utils/BoxedText";
import { cardConfig, type CardConfig } from "../utils/cardConfig";

export enum Operator {
  Plus = "+",
  Minus = "-",
  Multiply = "×",
  Divide = "/",
  Modulo = "mod",
}

export const OPERATORS = Object.values(Operator);

export type CardValue = number | Operator;

export enum CardEvents {
  FOCUSON = "focusOn",
  FOCUSOFF = "focusOff",
  SELECTION = "selection",
}

export default class CardBase extends BoxedText {
  readonly cardBaseConfig!: CardConfig;
  private isFocused!: boolean;
  private isSelected!: boolean;
  private value!: CardValue;

  constructor(scene: Scene, value: CardValue) {
    let text: string;
    if (typeof value === "number") text = value.toString();
    else text = value;

    super(scene, text, cardConfig.cardContentConfig, cardConfig.cardStyleConfig);

    this.cardBaseConfig = cardConfig;

    this.isFocused = false;
    this.isSelected = false;
    this.value = value;

    this.setInteractive();

    this.on("pointerover", this.focusOn, this);
    this.on("pointerout", this.focusOff, this);
    this.on("pointerdown", this.selected, this);
  }

  getIsSelected() {
    return this.isSelected;
  }

  setIsSelected(value: boolean) {
    this.isSelected = value;
  }

  getIsFocused() {
    return this.isFocused;
  }

  setIsFocused(value: boolean) {
    this.isFocused = value;
  }

  focusOn() {
    if (this.isFocused) return;

    this.emit(CardEvents.FOCUSON, this);
  }

  focusOff() {
    if (!this.isFocused) return;

    this.emit(CardEvents.FOCUSOFF, this);
  }

  selected() {
    this.emit(CardEvents.SELECTION, this);
  }

  setValue(value: CardValue) {
    this.value = value;
  }

  getValue() {
    return this.value;
  }

  isValueNumber() {
    return typeof this.value === "number";
  }

  isValueOperator() {
    return OPERATORS.includes(this.value as Operator);
  }
}
