import Phaser from "phaser";
import { EventBus } from "../EventBus";
import CardManager from "../gameobjects/cards/CardManager";
import CombatManager from "../gameobjects/CombatManager";
import { type CombatEventData } from "../events/CombatEventData";
import { GameManagerScene, GameEvents } from "./GameManagerScene";

export default class CombatScene extends Phaser.Scene {
  private cardManager!: CardManager;
  private combatManager!: CombatManager;
  private eventData: CombatEventData | undefined;

  constructor(handle: string) {
    super(handle);
  }

  init(eventData: CombatEventData) {
    eventData.player.inCombat = true;
    eventData.enemy.inCombat = true;
    this.eventData = eventData;
  }

  preload() {
    // load images for the combat scene
    // needs to know which enemy the player is going to fight
    // needs to know the status such as health point or the items (?) it has
    // temporarily set the background color for ths combat scene, needs to be replace by an image
    const backgroundColor = new Phaser.Display.Color(200, 200, 200);
    this.cameras.main.setBackgroundColor(backgroundColor.color);

    this.input.on("pointerdown", () => {
      if (this.input.activePointer.rightButtonDown()) {
        console.assert(this.eventData !== undefined, "this.eventData is undefined");
        this.endCombat(this.eventData);
      }
    });
  }

  create() {
    this.cardManager = new CardManager(this);
    this.combatManager = new CombatManager(this, this.cardManager);
    void this.combatManager;
    this.cardManager.fillCardHand(5);

    EventBus.emit("current-scene-ready", this);
  }

  update() {
    this.cardManager.alignAllCards();
  }

  endCombat(eventData: CombatEventData) {
    eventData.player.inCombat = false;
    eventData.player.isAlive = true;
    eventData.enemy.inCombat = false;
    eventData.enemy.isAlive = false;
    eventData.sceneInvoker = this;

    GameManagerScene.EventsCenter.emit(GameEvents.CombatOver, eventData);
    this.eventData = undefined;
  }
}
