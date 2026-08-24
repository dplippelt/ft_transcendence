import Phaser, { type Scene } from "phaser";
import CardManager, { cardManagerConfig } from "./cards/CardManager";
import Button from "./utils/Button";
import type { ButtonConfig } from "./utils/Button";
import { buttonContentConfig, buttonStyleConfig } from "./utils/buttonConfig";
import CombatTurnManager, { TurnEvents } from "./CombatTurnManager";
import type { PlayerStatus } from "../scenes/CombatScene";
import CombatEnemy, { type EnemyData } from "./CombatEnemy";
import CombatLayoutManager from "./CombatLayoutManager";
import CombatPlayer from "./CombatPlayer";
import CombatExecuteManager, { ExecuteCombo } from "./CombatExecuteManager";

const executeButtonConfig: ButtonConfig = {
  styleConfig: buttonStyleConfig,
  textConfig: buttonContentConfig,
};

export enum CombatEvents {
  ENDCOMBAT = "endCombat",
  ENDGAME = "endGame",
  PLAYERATTACK = "playerAttack",
  PLAYERGUARD = "PlayerGuard",
  ENEMYATTACK = "enemyAttack",
  TAKEDAMAGE = "takeDamage",
  ENDTURN = "endTurn",
}

export default class CombatManager {
  readonly scene: Scene;
  readonly player: CombatPlayer;
  readonly enemy: CombatEnemy;
  readonly cardManager: CardManager;
  readonly turnManager: CombatTurnManager;
  readonly executeManager: CombatExecuteManager;
  readonly events: Phaser.Events.EventEmitter;
  readonly executeButton: Button;
  readonly layoutManager: CombatLayoutManager;
  readonly hitpointsText: Phaser.GameObjects.Text;

  constructor(scene: Scene, playerStatus: PlayerStatus, enemyData: EnemyData) {
    this.scene = scene;
    this.player = new CombatPlayer(scene, playerStatus);
    this.enemy = new CombatEnemy(scene, enemyData);
    this.cardManager = new CardManager(scene, playerStatus, cardManagerConfig);
    this.turnManager = new CombatTurnManager(this);
    this.turnManager.turnEvents.on(TurnEvents.STARTPLAYER, this.initPlayerTurn, this);
    this.turnManager.turnEvents.on(TurnEvents.STARTENEMY, this.initEnemyTurn, this);
    this.executeManager = new CombatExecuteManager();
    this.events = new Phaser.Events.EventEmitter();
    this.events.on(CombatEvents.PLAYERATTACK, this.playerAttack, this);
    this.events.on(CombatEvents.PLAYERGUARD, this.playerGuard, this);
    this.events.on(CombatEvents.ENEMYATTACK, this.enemyAttack, this);
    this.events.on(CombatEvents.TAKEDAMAGE, this.takeDamage, this);
    this.events.on(CombatEvents.ENDTURN, this.endTurn, this);
    this.executeButton = new Button(scene, "Execute", executeButtonConfig);
    this.executeButton.on("pointerdown", this.execute, this);
    this.layoutManager = new CombatLayoutManager(this);
    this.turnManager.turnEvents.emit(TurnEvents.STARTPLAYER);
    // show player's hit point and enemy's hitpoint -> to be rendered with React
    this.hitpointsText = this.scene.add.text(500, 100, "hitpoints");
  }

  update() {
    // show a timer
    this.turnManager.displayTimer();

    // show player's hit point and enemy's hitpoint -> to be rendered with React
    const output: string[] = [];
    output.push("player hitPoint = " + this.player.status.hitPoint + " player mana: " + this.player.status.mana);
    output.push("enemy hitPoint = " + this.enemy.hitPoint);
    this.hitpointsText.setText(output);
  }

  initPlayerTurn() {
    this.cardManager.resetSelection();
    this.cardManager.clearHand();
    this.cardManager.fillCardHand(this.cardManager.config.maxNumCardsInHand);
    this.executeManager.reset();
  }

  initEnemyTurn() {
    if (this.executeManager.getResult() !== null) {
      this.events.emit(CombatEvents.PLAYERGUARD);
    } else {
      this.events.emit(CombatEvents.ENEMYATTACK);
    }
  }

  execute() {
    const cards = this.cardManager.cardSelection.getSelectedCards();

    this.executeManager.evaluateSelectedCards(cards);
    // TODO: make the logic to determine the value of combo in the executeManager
    this.executeManager.setCombo(ExecuteCombo.THREE);
    const points = this.executeManager.getResult();
    if (points !== null) {
      this.events.emit(CombatEvents.PLAYERATTACK);
    } else {
      // dealPenalty(this.playerStatus);
      // or just to ignore like the case of no cards would be fine?
    }
  }

  playerAttack() {
    this.events.emit(CombatEvents.TAKEDAMAGE, this.enemy);
  }

  playerGuard() {
    this.events.emit(CombatEvents.ENDTURN);
  }

  enemyAttack() {
    this.events.emit(CombatEvents.TAKEDAMAGE, this.player);
  }

  takeDamage(combatant: CombatPlayer | CombatEnemy) {
    if (combatant instanceof CombatEnemy) {
      switch (this.executeManager.getCombo()) {
        // TODO: Needs to decide how much damage is dealt accordingly.
        case ExecuteCombo.ONE:
          combatant.takeDamage(1);
          break;
        case ExecuteCombo.TWO:
          combatant.takeDamage(2);
          break;
        case ExecuteCombo.THREE:
          combatant.takeDamage(3);
          break;
        default:
          throw Error("Execution combo animation is not implemented.");
      }
      if (combatant.isDead()) {
        this.endCombat();
      }
    } else {
      combatant.takeDamage(1);
      if (combatant.isDead()) {
        this.endGame();
      }
    }
    this.events.emit(CombatEvents.ENDTURN);
  }

  endTurn() {
    this.turnManager.switchTurn();
  }

  endCombat() {
    this.turnManager.clock.removeAllEvents();
    this.events.emit(CombatEvents.ENDCOMBAT);
  }

  endGame() {
    this.turnManager.clock.removeAllEvents();
    this.events.emit(CombatEvents.ENDGAME);
  }
}
