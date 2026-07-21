import Phaser from "phaser";
import { EventBus } from "../EventBus";
import CombatManager from "../gameobjects/CombatManager";
import { EnemyLevel, enemyTypes, type EnemyData } from "../gameobjects/CombatEnemy";

export interface PlayerStatus {
  hitPoint: number;
  mana: number;
}


export default class CombatScene extends Phaser.Scene {
  private playerStatus!: PlayerStatus;
  private enemyData!: EnemyData;
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
    this.playerStatus = {
      hitPoint: 100,
      mana: 5,
    };

    this.enemyData = enemyTypes[EnemyLevel.NORMAL];

    this.combatManager = new CombatManager(this, this.playerStatus, this.enemyData);

    EventBus.emit("current-scene-ready", this);
  }

  update() {
    this.combatManager.update();
  }
}
