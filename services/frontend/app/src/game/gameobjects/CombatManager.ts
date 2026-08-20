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
  PLAYERATTACK = "playerAttack",
  ENEMYATTACK = "enemyAttack",
  TAKEDAMAGE = "takeDamage",
}

export default class CombatManager {
  readonly scene: Scene;
  readonly player: CombatPlayer;
  readonly enemy: CombatEnemy;
  readonly cardManager: CardManager;
  readonly turnManager: CombatTurnManager;
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
    this.turnManager.turnEvents.on(TurnEvents.STARTENEMY, this.executeEnemyEffect, this);
    this.events = new Phaser.Events.EventEmitter();
    this.events.on(CombatEvents.PLAYERATTACK, this.playerAttack, this);
    this.events.on(CombatEvents.ENEMYATTACK, this.enemyAttack, this);
    this.events.on(CombatEvents.TAKEDAMAGE, this.takeDamage, this);
    this.executeButton = new Button(scene, "Execute", executeButtonConfig);
    this.executeButton.on("pointerdown", this.execute, this);
    this.layoutManager = new CombatLayoutManager(this);
    this.initPlayerTurn();
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
    // TODO: Fix this hard cord.
    this.cardManager.fillCardHand(5);
  }

  executeEnemyEffect() {
    const points = 10;
    this.events.emit(CombatEvents.ENEMYATTACK, this.enemy, this.player, points);
  }

  execute() {
    const cards = this.cardManager.cardSelection.getSelectedCards();

    if (!cards.length) {
      return;
    }

    const points = this.evaluateSelectedCards(cards);
    console.log(points);
    if (points === null) {
      // dealPenalty(this.playerStatus);
      // TODO
    } else {
      this.events.emit(CombatEvents.PLAYERATTACK, this.player, this.enemy, points);
    }
  }

  playerAttack(player: CombatPlayer, enemy: CombatEnemy, points: number) {
    this.events.emit(CombatEvents.TAKEDAMAGE, enemy, points);
  }

  enemyAttack(enemy: CombatEnemy, player: CombatEnemy, points: number) {
    this.events.emit(CombatEvents.TAKEDAMAGE, player, points);
  }

  takeDamage(combatant: CombatPlayer | CombatEnemy, points: number) {
    combatant.takeDamage(points);
    if (combatant.isDead()) {
      if (combatant instanceof CombatPlayer) {
        this.endGame();
      } else {
        this.endCombat();
      }
    }
    if (combatant instanceof CombatEnemy) {
      this.turnManager.switchTurn();
    }
  }

  endCombat() {
    this.turnManager.clock.removeAllEvents();
    this.events.emit(CombatEvents.ENDCOMBAT);
  }

  endGame() {
    this.turnManager.clock.removeAllEvents();
    this.events.emit(CombatEvents.ENDGAME);
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
