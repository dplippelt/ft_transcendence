import Phaser, { type Scene } from "phaser";
import CardManager from "./cards/CardManager";
import CombatTurnManager, { TurnEvents } from "./CombatTurnManager";
import { initPlayerStatus, type PlayerStatus } from "../scenes/CombatScene";
import CombatEnemy, { type EnemyData } from "./CombatEnemy";
import CombatLayoutManager from "./CombatLayoutManager";
import CombatPlayer from "./CombatPlayer";
import CombatExecuteManager, { damageToEnemyConfig, ExecuteCombo, type DamageToEnemy } from "./CombatExecuteManager";
import { EventBus } from "../EventBus";
import { CombatEvent } from "../../utils/utils";

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
  readonly layoutManager: CombatLayoutManager;
  readonly damageToEnemyOn: DamageToEnemy = damageToEnemyConfig;
  readonly enemyData: EnemyData;

  constructor(scene: Scene, playerStatus: PlayerStatus, enemyData: EnemyData) {
    this.scene = scene;
    this.enemyData = enemyData;
    this.player = new CombatPlayer(scene, playerStatus);
    this.enemy = new CombatEnemy(scene, enemyData);
    this.cardManager = new CardManager(scene, playerStatus);
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
    this.layoutManager = new CombatLayoutManager(this);
    this.turnManager.turnEvents.emit(TurnEvents.STARTPLAYER);
  }

  update() {
  }

  initPlayerTurn() {
    this.cardManager.resetSelection();
    this.cardManager.clearHand(true);
    this.cardManager.fillCardHand(this.cardManager.maxNumCardsInHand);
    this.executeManager.reset();
    EventBus.emit(CombatEvent.initTurn, this.turnManager.getPlayerDelayMs());
  }

  initEnemyTurn() {
    EventBus.emit(CombatEvent.turnEnded);
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
    this.executeManager.setCombo(ExecuteCombo.TWO);
    const points = this.executeManager.getResult();
    if (points !== null) {
      this.events.emit(CombatEvents.PLAYERATTACK);
      // EventBus.emit(CombatEvent.turnEnded); // TODO: Either call it here or in CombaTurnManager.pausePlayerTurn()
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
      const combo = this.executeManager.getCombo()!;
      combatant.takeDamage(this.damageToEnemyOn[combo]);
      EventBus.emit(CombatEvent.updateEnemyHP, this.enemy.hitPoint);
      if (combatant.isDead()) {
        this.endCombat();
        return;
      }
    } else {
      combatant.takeDamage(this.enemy.enemyData.attackDamage);
      EventBus.emit(CombatEvent.updatePlayerHP, this.player.status.hitPoint);
      if (combatant.isDead()) {
        this.endGame();
        return;
      }
    }
    this.events.emit(CombatEvents.ENDTURN);
  }

  endTurn() {
    this.turnManager.switchTurn();
  }

  endCombat() {
    this.turnManager.clock.removeAllEvents();
    this.turnManager.destroy();
    this.events.emit(CombatEvents.ENDCOMBAT);
  }

  endGame() {
    this.turnManager.clock.removeAllEvents();
    this.turnManager.destroy();
    this.events.emit(CombatEvents.ENDGAME);
  }

  sendInitPlayerHP() {
    EventBus.emit(CombatEvent.initPlayerHP, initPlayerStatus.hitPoint);
  }

  sendInitPlayerMP() {
    EventBus.emit(CombatEvent.initPlayerMP, initPlayerStatus.mana);
  }

  sendInitEnemyHP() {
    EventBus.emit(CombatEvent.initEnemyHP, this.enemyData.hitPoint);
  }

  sendCurrPlayerHP() {
    EventBus.emit(CombatEvent.updatePlayerHP, this.player.status.hitPoint);
  }

  sendCurrPlayerMP() {
    EventBus.emit(CombatEvent.updatePlayerMP, this.player.status.mana);
  }

  sendCurrEnemyHP() {
    EventBus.emit(CombatEvent.updateEnemyHP, this.enemy.hitPoint);
  }
}
