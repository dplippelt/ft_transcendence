import Phaser from "phaser";
import { EventBus } from "../EventBus";
import CombatManager, { CombatEvents } from "../gameobjects/CombatManager";
import { type CombatEventData } from "../events/CombatEventData";
import { GameManagerScene, GameEvents } from "./GameManagerScene";
import { EnemyLevel, enemyTypes, type EnemyData } from "../gameobjects/CombatEnemy";

export interface PlayerStatus {
  hitPoint: number;
  mana: number;
}

export default class CombatScene extends Phaser.Scene {
  private playerStatus!: PlayerStatus;
  private enemyData!: EnemyData;
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

    this.input.on("pointerdown", () => {
      if (this.input.activePointer.rightButtonDown()) {
        console.assert(this.eventData !== undefined, "this.eventData is undefined");
        this.endCombat(this.eventData!);
      }
    });
  }

  create() {
    this.playerStatus = {
      hitPoint: 100,
      mana: 5,
    };

    this.enemyData = enemyTypes[EnemyLevel.NORMAL];

    this.combatManager = new CombatManager(this, this.playerStatus, this.enemyData);
    this.combatManager.events.on(CombatEvents.ENDCOMBAT, () => {
        console.assert(this.eventData !== undefined, "this.eventData is undefined");
        this.endCombat(this.eventData!);
    }, this);

    this.combatManager.events.on(CombatEvents.ENDGAME, () => {
        console.assert(this.eventData !== undefined, "this.eventData is undefined");
        this.endGame(this.eventData!);
    }, this);

    EventBus.emit("current-scene-ready", this);
  }

  update() {
    this.combatManager.update();
  }

  endCombat(eventData: CombatEventData) {
    console.log("End Combat");
    eventData.player.inCombat = false;
    eventData.player.isAlive = true;
    eventData.enemy.inCombat = false;
    eventData.enemy.isAlive = false;
    eventData.sceneInvoker = this;

    GameManagerScene.EventsCenter.emit(GameEvents.CombatOver, eventData);
    this.eventData = undefined;
  }

  endGame(eventData: CombatEventData) {
    console.log("Game Over");
    eventData.player.inCombat = false;
    eventData.player.isAlive = false;
    eventData.enemy.inCombat = false;
    eventData.enemy.isAlive = true;
    eventData.sceneInvoker = this;

    GameManagerScene.EventsCenter.emit(GameEvents.CombatOver, eventData);
    this.eventData = undefined;
  }
}
