import Phaser, { Scene } from "phaser";
import { cardConfig, type CardConfig } from "../utils/cardConfig";
import StyledText from "../utils/StyledText";
import { AssetsKey } from "../../Assets";

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

const cardSize = {
    width: 64,
    height: 96
};

export default class CardBase extends Phaser.GameObjects.Container {
  readonly cardBaseConfig!: CardConfig;
  private isFocused!: boolean;
  private isSelected!: boolean;
  private value: CardValue | undefined;

  constructor(scene: Scene, value?: CardValue) {
    super(scene);
    this.cardBaseConfig = cardConfig;

    if (value === undefined) {
        this.createCardBack(scene);
    } else {
        this.createCard(scene, value);
    }

    this.setSize(cardSize.width, cardSize.height);
    this.setInteractive();

    this.isFocused = false;
    this.isSelected = false;
    this.value = value;

    this.on("pointerover", this.focusOn, this);
    this.on("pointerout", this.focusOff, this);
    this.on("pointerdown", this.selected, this);
  }

  createCardBack(scene: Scene) {
    const frame = 4;
    const sprite = new Phaser.GameObjects.Sprite(scene, 0, 0, AssetsKey.Cards, frame);
    this.add(sprite);
  }

  createCard(scene: Scene, value: CardValue) {
    const text: string = typeof value === "number" ? value.toString() : value;
    const frame: number = typeof value === "number" ? 9 : 11;

    const content = new StyledText(scene, 0, 0, text, cardConfig.cardContentConfig);
    const { x, y } = content.getCenter();
    content.setOrigin(x / content.width, y / content.height);

    const sprite = new Phaser.GameObjects.Sprite(scene, 0, 0, AssetsKey.Cards, frame);

    this.add([sprite, content]);
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
    if (this.getIsSelected()) return;
    this.setIsFocused(true);
    this.emit(CardEvents.FOCUSON, this);
  }

  focusOff() {
    if (!this.isFocused) return;
    this.setIsFocused(false);
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
