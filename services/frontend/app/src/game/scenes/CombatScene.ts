import Phaser from "phaser";
import { EventBus } from "../EventBus";
import BoxedText from "../gameobjects/utils/BoxedText";
import { buttonContentConfig, buttonStyleConfig } from "../gameobjects/utils/buttonConfig";
import CardManager from "../gameobjects/cards/CardManager";

export default class CombatScene extends Phaser.Scene {
  private cardManager!: CardManager;

  constructor() {
    super("combat");
  }

  preload() {
    // load images for the combat scene
    // needs to know which enemy the player is going to fight
    // needs to know the status such as health point or the items (?) it has
    // temporarily set the background color for ths combat scene, needs to be replace by an image
    const backgroundColor = new Phaser.Display.Color(200, 200, 200);
    this.cameras.main.setBackgroundColor(backgroundColor.color);
  }

  create() {
    this.cardManager = new CardManager(this);
    this.cardManager.fillCardHand(5);

    this.createExecuteButton("Execute!");

    EventBus.emit("current-scene-ready", this);
  }

  update() {
    this.cardManager.alignAllCards();
  }

  createExecuteButton(text: string) {
    const button = new BoxedText(this, text, buttonContentConfig, buttonStyleConfig, 100, 50);
    this.add.existing(button);

    button.setInteractive();
    button.on("pointerdown", this.execute, this);

    return button;
  }

  execute() {
    const cards = this.cardManager.cardSelection.getSelectedCards();

    if (!cards.length) {
      console.log("no cards");
      return;
    }

    const result = this.cardManager.cardHand.evaluateSelectedCards(cards);

    console.log(result);
    this.cardManager.clearHandAndSelection();
    this.cardManager.fillCardHand(5);
    // Give the enemy damages or give the player penalty
    // Generate new card hands
    // Clear selected cards from slot
    // Reset timer
  }
}
