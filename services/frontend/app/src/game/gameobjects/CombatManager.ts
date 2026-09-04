import Phaser, { type Scene } from "phaser";
import CardManager from "./cards/CardManager";
import CombatTurnManager, { TurnEvents } from "./CombatTurnManager";
import type { PlayerStatus } from "../scenes/CombatScene";
import CombatEnemy, { type EnemyData } from "./CombatEnemy";
import CombatLayoutManager from "./CombatLayoutManager";
import CombatPlayer from "./CombatPlayer";
import CombatExecuteManager, { damageToEnemyConfig, type DamageToEnemy } from "./CombatExecuteManager";
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
  JUDGERESULT = "judgeResult",
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

  constructor(scene: Scene, playerStatus: PlayerStatus, enemyData: EnemyData) {
    this.scene = scene;
    this.player = new CombatPlayer(scene, playerStatus);
    this.enemy = new CombatEnemy(scene, enemyData);
    this.cardManager = new CardManager(scene, playerStatus);
    this.turnManager = new CombatTurnManager(this);
    this.onTurnAction();
    this.executeManager = new CombatExecuteManager();
    this.events = new Phaser.Events.EventEmitter();
    this.onCombatAction();
    this.layoutManager = new CombatLayoutManager(this);
    this.turnManager.turnEvents.emit(TurnEvents.STARTPLAYER);
    EventBus.emit(CombatEvent.initPlayerHP, this.player.status.hitPoint);
    EventBus.emit(CombatEvent.initPlayerMP, this.player.status.mana);
    EventBus.emit(CombatEvent.initEnemyHP, this.enemy.hitPoint);
    EventBus.addListener(CombatEvent.attack, this.execute, this);
  }

  update() {}

  onTurnAction() {
    const events = this.turnManager.turnEvents;
    events.on(TurnEvents.STARTPLAYER, this.initPlayerTurn, this);
    events.on(TurnEvents.STARTENEMY, this.initEnemyTurn, this);
  }

  onCombatAction() {
    this.events.on(CombatEvents.PLAYERATTACK, this.playerAttack, this);
    this.events.on(CombatEvents.PLAYERGUARD, this.playerGuard, this);
    this.events.on(CombatEvents.ENEMYATTACK, this.enemyAttack, this);
    this.events.on(CombatEvents.TAKEDAMAGE, this.takeDamage, this);
    this.events.on(CombatEvents.ENDTURN, this.endTurn, this);
    this.events.on(CombatEvents.JUDGERESULT, this.judgeResult, this);
  }

  initPlayerTurn() {
    this.cardManager.resetSelection();
    this.cardManager.clearHand(true);
    this.cardManager.fillCardHand(this.cardManager.maxNumCardsInHand);
    this.executeManager.reset();
    this.executeManager.generateTargetNumbersFromHand(this.cardManager.cardHand.getHandCards());
    EventBus.emit(CombatEvent.initTurn, this.turnManager.getPlayerDelayMs());
    // TODO: emit an event for displaying targetNumbers
  }

  initEnemyTurn() {
    EventBus.emit(CombatEvent.turnEnded);
    if (this.executeManager.isSuccessHitTarget()) {
      this.events.emit(CombatEvents.PLAYERGUARD);
    } else {
      this.events.emit(CombatEvents.ENEMYATTACK);
    }
  }

  execute() {
    const cards = this.cardManager.cardSelection.getSelectedCards();
    this.executeManager.evaluateSelectedCards(cards);
    if (this.executeManager.getResult() === null) {
      return;
    }
    this.events.emit(CombatEvents.JUDGERESULT);
  }

  judgeResult() {
    if (this.executeManager.isSuccessHitTarget()) {
      this.events.emit(CombatEvents.PLAYERATTACK);
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
}
