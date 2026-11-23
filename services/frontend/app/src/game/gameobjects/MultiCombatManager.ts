import Phaser, { Scene } from "phaser";
import type { ICombatView } from "./ICombatView";
import CombatPlayer from "./CombatPlayer";
import CombatEnemy from "./CombatEnemy";
import CombatLayoutManager from "./CombatLayoutManager";
import type { Action } from "../network/IGameSocket";
import type { CombatActionEvent, CombatState } from "../network/CombatTypes";
import MultiCardManager from "./cards/MultiCardManager";
import { ActionType, Direction } from "../network/IGameSocket";
import { EventBus } from "../EventBus";
import { CombatEvent } from "../../utils/utils";
import { ExecuteCombo } from "./CombatExecuteManager";
import { CombatEvents } from "./CombatManager";

export enum MultiCombatEvents {
    TURN_SHOW = "turnShown",
    COMBAT_FINISHED = "combatFinished",
}

export default class MultiCombatManager implements ICombatView {
  readonly player: CombatPlayer;
  readonly enemy: CombatEnemy;
  readonly cardManager: MultiCardManager;
  readonly events: Phaser.Events.EventEmitter;
  readonly layoutManager: CombatLayoutManager;
  private latestTick: number = 0;
  isPlaying: boolean = false;
  private readonly targetNumbers: Record<ExecuteCombo, number | null> = {
    [ExecuteCombo.ONE]: null,
    [ExecuteCombo.TWO]: null,
    [ExecuteCombo.THREE]: null,
  };

  constructor(
    readonly scene: Scene,
    state: CombatState,
    tick: number,
  ) {
    this.player = new CombatPlayer(scene, {
      hitPoint: state.player.hp,
      mana: state.player.mp,
    });
    this.enemy = new CombatEnemy(scene, {
      hitPoint: state.enemy.hp,
      attackDamage: state.enemy.attack_damage,
    });
    this.cardManager = new MultiCardManager(scene);
    this.events = new Phaser.Events.EventEmitter();
    this.layoutManager = new CombatLayoutManager(this);
    this.events.on(CombatEvents.COMPLETEFILLHAND, () => {
      EventBus.emit(CombatEvent.completeFillHand);
    });
    this.cardManager.syncHand(state.hand);
    this.latestTick = tick;
  }

  sendPlayCards() {
    const cards = this.cardManager.getSelectedCardIds();
    if (cards.length === 0) {
      return null;
    }
    const action: Action = {
      type: ActionType.PLAY_CARDS,
      direction: Direction.NONE,
      card: 0,
      cards: cards,
    };
    return action;
  }

  sendRedraw() {
    const action: Action = {
      type: ActionType.DRAW_CARD,
      direction: Direction.NONE,
      card: 0,
      cards: [],
    };
    return action;
  }

  setLatestTick(tick: number) {
    this.latestTick = tick;
  }

  resync(state: CombatState) {}

  handleEvents(events: CombatActionEvent[], state: CombatState) {}

  // DEBUG: log new combat events and find hand dealt event
  //   private logNewEvents(state: CombatState) {
  //     let handDealt = false;
  //     for (const event of state.events) {
  //       if (event.seq <= this.lastEventSeq) {
  //         continue;
  //       }
  //       this.lastEventSeq = event.seq;
  //       if (type === "hand_dealt") {
  //         handDealt = true;
  //       }
  //       if (handDealt) {
  //         console.log(
  //           "[combat] phase: ",
  //           state.phase,
  //           "| targets;",
  //           state.target_numbers,
  //           "| hand:",
  //           state.hand.map((c) => c.value).join(" "),
  //           "| player hp/mp;",
  //           state.player.hp,
  //           state.player.mp,
  //           "| enemy hp;",
  //           state.enemy.hp,
  //         );
  //       }
  //       return handDealt;
  //     }
  //   }

  private updateTargetNumbers(target: (number | null)[]) {
    this.targetNumbers[ExecuteCombo.ONE] = target[ExecuteCombo.ONE];
    this.targetNumbers[ExecuteCombo.TWO] = target[ExecuteCombo.TWO];
    this.targetNumbers[ExecuteCombo.THREE] = target[ExecuteCombo.THREE];
  }

  sendInitPlayerHP() {
    EventBus.emit(CombatEvent.initPlayerHP, this.player.status.hitPoint);
  }

  sendInitPlayerMP() {
    EventBus.emit(CombatEvent.initPlayerMP, this.player.status.mana);
  }

  sendInitEnemyHP() {
    EventBus.emit(CombatEvent.initEnemyHP, this.enemy.hitPoint);
  }

  sendInitTargetNumbers() {
    EventBus.emit(CombatEvent.initTargetNumbers, this.targetNumbers);
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

  sendCurrTargetNumbers() {
    EventBus.emit(CombatEvent.updateTargetNumbers, this.targetNumbers);
  }

  sendElapsedPlayerTime() {
    // const elapsedTime = this.turnManager.getElapsedPlayerTime();
    // if (elapsedTime === null) {
    //   return;
    // }
    // EventBus.emit(CombatEvent.initTurn, this.turnManager.getPlayerDelayMs(), elapsedTime);
  }
}
