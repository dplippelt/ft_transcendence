import Phaser from "phaser";
import { EventBus } from "../EventBus";
import CardManager from "../gameobjects/cards/CardManager";
import CombatManager from "../gameobjects/CombatManager";

export default class CombatScene extends Phaser.Scene {
  private cardManager!: CardManager;
  private combatManager!: CombatManager;

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
    this.combatManager = new CombatManager(this, this.cardManager);
    this.cardManager.fillCardHand(5);

    EventBus.emit("current-scene-ready", this);
  }

  update() {
    this.cardManager.alignAllCards();
  }
}
