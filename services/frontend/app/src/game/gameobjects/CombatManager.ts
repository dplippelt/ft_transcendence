import Phaser, { type Scene } from "phaser";
import CardManager, { cardManagerConfig } from "./cards/CardManager";
import type CardBase from "./cards/CardBase";
import { Operator, type CardValue } from "./cards/CardBase";
import Button from "./utils/Button";
import type { ButtonConfig } from "./utils/Button";
import { buttonContentConfig, buttonStyleConfig } from "./utils/buttonConfig";
import CombatTurnManager, { TurnEvents } from "./CombatTurnManager";
import type { PlayerStatus } from "../scenes/CombatScene";
import CombatEnemy, { type EnemyData } from "./CombatEnemy";
import CombatLayoutManager from "./CombatLayoutManager";
import CombatPlayer from "./CombatPlayer";

const executeButtonConfig: ButtonConfig = {
  styleConfig: buttonStyleConfig,
  textConfig: buttonContentConfig,
};

export enum CombatEvents {
  ENDCOMBAT = "endCombat",
  ENDGAME = "endGame",
}

export default class CombatManager {
  readonly scene: Scene;
  readonly player: CombatPlayer;
//   readonly playerStatus: PlayerStatus;
  readonly enemy: CombatEnemy;
  readonly cardManager: CardManager;
  readonly turnManager: CombatTurnManager;
  readonly events: Phaser.Events.EventEmitter;
  readonly executeButton: Button;
  readonly layoutManager: CombatLayoutManager;
  // show player's hit point and enemy's hitpoint -> to be rendered with React
  readonly hitpointsText: Phaser.GameObjects.Text;

  constructor(scene: Scene, playerStatus: PlayerStatus, enemyData: EnemyData) {
    this.scene = scene;
    // this.playerStatus = playerStatus;
    this.player = new CombatPlayer(scene, playerStatus);
    this.enemy = new CombatEnemy(scene, enemyData);
    this.cardManager = new CardManager(scene, playerStatus, cardManagerConfig);
    this.turnManager = new CombatTurnManager(this);
    this.turnManager.turnEvents.on(TurnEvents.STARTPLAYER, this.initPlayerTurn, this);
    this.turnManager.turnEvents.on(TurnEvents.STARTENEMY, this.executeEnemyEffect, this);
    this.events = new Phaser.Events.EventEmitter();
    this.executeButton = new Button(scene, "Execute", executeButtonConfig);
    this.executeButton.on("pointerdown", this.execute, this);
    this.layoutManager = new CombatLayoutManager(this);
    this.initPlayerTurn();
    // show player's hit point and enemy's hitpoint -> to be rendered with React
    this.hitpointsText = this.scene.add.text(500, 100, "hitpoints");
  }

  update() {
    this.layoutManager.align();

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
    this.cardManager.fillCardHand(5);
  }

  executeEnemyEffect() {
    console.log("attack damage");
    this.enemy.attack(this.player);
    this.playerTakeDamageEffect();
    if (this.player.isDead()) {
      this.endGame();
    }
  }

  execute() {
    const cards = this.cardManager.cardSelection.getSelectedCards();

    if (!cards.length) {
      console.log("no cards");
      return;
    }

    const result = this.evaluateSelectedCards(cards);
    console.log(result);
    if (result === null) {
      // dealPenalty(this.playerStatus);
      // TODO
    } else {
      this.player.attack(this.enemy, result);
    //   this.enemy.takeDamage(result);
      this.playerAttackEffect();
    }
    if (this.player.isDead()) {
      this.endGame();
      return;
    }
    if (this.enemy.isDead()) {
      this.endCombat();
      return;
    }
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

  playerAttackEffect() {
    this.scene.cameras.main.shake(500);
  }

  playerTakeDamageEffect() {
    this.scene.cameras.main.shake(500);
  }

  evaluateSelectedCards(selectedCards: CardBase[]) {
    if (!this.isValidSelection(selectedCards)) return null;

    const values = this.evaluateHighPrecedenceOperations(selectedCards);
    if (!values) return null;

    const result = this.evaluateLowPrecedenceOperations(values);
    return result;
  }

  evaluateHighPrecedenceOperations(selectedCards: CardBase[]) {
    const values: CardValue[] = [];

    for (let i = 0; i < selectedCards.length; ++i) {
      const card = selectedCards[i];

      if (i % 2 === 0) {
        const currNum = card.getValue() as number;

        if (!values.length) {
          values.push(currNum);
          continue;
        }

        const operator = values.pop() as Operator;
        const preNum = values.pop() as number;

        switch (operator) {
          case Operator.Multiply:
            values.push(preNum * currNum);
            break;

          case Operator.Divide:
            if (currNum === 0) return null;
            values.push(preNum / currNum);
            break;

          case Operator.Modulo:
            if (currNum === 0) return null;
            values.push(preNum % currNum);
            break;

          default:
            values.push(preNum);
            values.push(operator);
            values.push(currNum);
            break;
        }
      } else {
        const operator = card.getValue() as Operator;
        values.push(operator);
      }
    }

    return values;
  }

  evaluateLowPrecedenceOperations(values: CardValue[]) {
    let num = values[0] as number;

    for (let i = 2; i < values.length; i += 2) {
      const currNum = values[i] as number;
      const operator = values[i - 1] as Operator;

      switch (operator) {
        case Operator.Plus:
          num += currNum;
          break;

        case Operator.Minus:
          num -= currNum;
          break;

        default:
          break;
      }
    }

    return num;
  }

  isValidSelection(selectedCard: CardBase[]) {
    if (selectedCard.length % 2 === 0) return false;

    for (let i = 0; i < selectedCard.length; ++i) {
      const card = selectedCard[i];

      if (i % 2 === 0) {
        if (!card.isValueNumber()) return false;
      } else {
        if (!card.isValueOperator()) return false;
      }
    }
    return true;
  }
}
