import { Scene } from "phaser";
import { cardStyleConfig, type CardStyleConfig } from "./CardStyle";
import { cardContentConfig, type CardContentConfig } from "./CardContent";
import type { Operator } from "./OperatorCard";
import BoxedText from "../utils/BoxedText";

interface CardBaseConfig {
  cardStyleConfig: CardStyleConfig;
  cardContentConfig: CardContentConfig;
  focusDiff: number;
}

const cardBaseConfig: CardBaseConfig = {
  cardStyleConfig: cardStyleConfig,
  cardContentConfig: cardContentConfig,
  focusDiff: 30,
};

export type CardValue = number | Operator;

export enum CardEvents {
  FOCUSON = "focusOn",
  FOCUSOFF = "focusOff",
  SELECTION = "selection",
}

export default class CardBase extends BoxedText {
  readonly cardBaseConfig!: CardBaseConfig;
  private isFocused!: boolean;
  private isSelected!: boolean;
  private value: CardValue | undefined;

  constructor(scene: Scene, text: string) {
    super(scene, text, cardBaseConfig.cardContentConfig, cardBaseConfig.cardStyleConfig);

    this.cardBaseConfig = cardBaseConfig;

    this.isFocused = false;
    this.isSelected = false;

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
}
