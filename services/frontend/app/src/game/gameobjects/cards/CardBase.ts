import Phaser, { Scene } from "phaser";
import CardStyle, { cardStyleConfig, type CardStyleConfig } from "./CardStyle";
import CardContent, { cardContentConfig, type CardContentConfig } from "./CardContent";
import type { Operator } from "./OperatorCard";

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

export default class CardBase extends Phaser.GameObjects.Container {
  readonly cardBaseConfig!: CardBaseConfig;
  readonly content!: CardContent;
  readonly style!: CardStyle;
  private isFocused!: boolean;
  private isSelected!: boolean;
  private value: CardValue | undefined;

  constructor(scene: Scene, text: string) {
    super(scene);
    scene.add.existing(this);

    this.cardBaseConfig = cardBaseConfig;
    this.content = new CardContent(scene, 0, 0, text, this.cardBaseConfig.cardContentConfig);
    const { x, y } = this.content.getCenter();
    this.content.setOrigin(x / this.content.width, y / this.content.height);

    this.style = new CardStyle(scene, 0, 0, this.cardBaseConfig.cardStyleConfig);

    this.add([this.style, this.content]);

    this.setSize(this.style.width, this.style.height);

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
