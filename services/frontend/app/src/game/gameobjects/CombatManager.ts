import Phaser, { type Scene } from "phaser";
import CardManager from "./cards/CardManager";
import type CardBase from "./cards/CardBase";
import { Operator, type CardValue } from "./cards/CardBase";
import Button from "./utils/Button";
import type { ButtonConfig } from "./utils/Button";
import { buttonContentConfig, buttonStyleConfig } from "./utils/buttonConfig";
import CombatTimeManager from "./CombatTimeManager";
import type { PlayerStatus } from "../scenes/CombatScene";
import CombatEnemy, { type EnemyData } from "./CombatEnemy";

const executeButtonConfig: ButtonConfig = {
  styleConfig: buttonStyleConfig,
  textConfig: buttonContentConfig,
};

export default class CombatManager {
  readonly scene: Scene;
  readonly playerStatus: PlayerStatus;
  readonly enemy: CombatEnemy;
  readonly cardManager: CardManager;
  readonly executeButton: Button;
  readonly timeManager: CombatTimeManager;

  constructor(scene: Scene, playerStatus: PlayerStatus, enemyData: EnemyData) {
    this.scene = scene;
    this.playerStatus = playerStatus;
    this.enemy = new CombatEnemy(scene, enemyData);
    this.cardManager = new CardManager(scene);
    this.cardManager.fillCardHand(5);
    this.executeButton = new Button(scene, "Execute", executeButtonConfig);
    this.executeButton.setPosition(100, 50);
    this.executeButton.on("pointerdown", this.execute, this);
    this.timeManager = new CombatTimeManager(this);
  }

  update() {
    this.cardManager.alignAllCards();

    // show a timer
    this.timeManager.displayTimer();

    // show player's hit point and enemy's hitpoint
    console.log("player hitPoint = " + this.playerStatus.hitPoint);
    console.log("enemy hitPoint = " + this.enemy.hitPoint);
    //
  }

  executeEnemyEffect() {
    this.enemy.attack(this.playerStatus);
    if (this.playerStatus.hitPoint <= 0) {
      // TODO: implement the ending condition
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
    if (!result) {
      // dealPenalty(this.playerStatus);
      // TODO
    } else {
      this.enemy.takeDamage(result);
    }
    if (this.playerStatus.hitPoint <= 0) {
      this.endGame();
    }
    if (this.enemy.hitPoint <= 0) {
      this.endCombat();
    }
    this.cardManager.clearHandAndSelection();
    this.cardManager.fillCardHand(5);
    this.timeManager.switchTurn();
  }

  endGame() {
    console.log("Game over");
  }

  endCombat() {
    console.log("You win");
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
