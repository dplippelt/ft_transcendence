import Phaser, { Scene } from "phaser";
import type { ICombatView } from "./ICombatView";
import CombatPlayer from "./CombatPlayer";
import CombatEnemy from "./CombatEnemy";
import CombatLayoutManager from "./CombatLayoutManager";
import type { IGameSocket } from "../network/IGameSocket";
import type { CombatState } from "../network/CombatTypes";
import MultiCardManager from "./cards/MultiCardManager";
import { ActionType, Direction } from "../network/IGameSocket";
import { EventBus } from "../EventBus";
import { CombatEvent } from "../../utils/utils";
import { ExecuteCombo } from "./CombatExecuteManager";

export default class MultiCombatManager implements ICombatView {
  readonly player: CombatPlayer;
  readonly enemy: CombatEnemy;
  readonly cardManager: MultiCardManager;
  readonly events: Phaser.Events.EventEmitter;
  readonly layoutManager: CombatLayoutManager;
  private latestState: CombatState;
  private lastEventSeq: number = 0;
  private pendingSequence: number | null = null;

  constructor(
    readonly scene: Scene,
    private readonly socket: IGameSocket,
    initial: CombatState,
  ) {
    this.player = new CombatPlayer(scene, {
      hitPoint: initial.player.hp,
      mana: initial.player.mp,
    });
    this.enemy = new CombatEnemy(scene, {
      hitPoint: initial.enemy.hp,
      attackDamage: 0,
    });
    this.cardManager = new MultiCardManager(scene);
    this.events = new Phaser.Events.EventEmitter();
    this.layoutManager = new CombatLayoutManager(this);
    this.latestState = initial;
    this.cardManager.syncHand(initial.hand);
    this.emitStatusToUI(initial);
    void this.latestState; // TODO:
    this.logNewEvents(initial);
  }

  sendPlayCards() {
    if (this.pendingSequence !== null) {
      return;
    }
    const cards = this.cardManager.getSelectedCardIds();
    if (cards.length === 0) {
      return;
    }
    const seq = this.socket.sendAction({
      type: ActionType.PLAY_CARDS,
      direction: Direction.NONE,
      card: 0,
      cards: cards,
    });
    if (seq === null) {
      return;
    }
    this.pendingSequence = seq;
    this.cardManager.lockSelection(true);
  }

  sendRedraw() {
    // TODO
  }

  applyState(state: CombatState, ackSequence: number) {
    this.latestState = state;
    const handDealt = this.logNewEvents(state); // TODO
    if (handDealt) {
      this.cardManager.syncHand(state.hand);
    }
    if (this.pendingSequence !== null && ackSequence >= this.pendingSequence) {
      this.pendingSequence = null;
      this.cardManager.lockSelection(false);
    }
    this.emitStatusToUI(state);
  }

  private emitStatusToUI(state: CombatState) {
    // TODO:
    EventBus.emit(CombatEvent.updatePlayerHP, state.player.hp);
    EventBus.emit(CombatEvent.updatePlayerMP, state.player.mp);
    EventBus.emit(CombatEvent.updateEnemyHP, state.enemy.hp);
    EventBus.emit(CombatEvent.updateTargetNumbers, this.toTargetRecord(state.target_numbers));
  }

  // DEBUG: log new combat events and find hand dealt event
  private logNewEvents(state: CombatState) {
    let handDealt = false;
    for (const event of state.events) {
      if (event.seq <= this.lastEventSeq) {
        continue;
      }
      this.lastEventSeq = event.seq;
      const { seq, tick, type, ...detail } = event;
      console.log(`[combat] #${seq} tick ${tick} ${type}`, detail);
      if (type === "hand_dealt") {
        handDealt = true;
      }
      if (handDealt) {
        console.log(
          "[combat] phase: ",
          state.phase,
          "| targets;",
          state.target_numbers,
          "| hand:",
          state.hand.map((c) => c.value).join(" "),
          "| player hp/mp;",
          state.player.hp,
          state.player.mp,
          "| enemy hp;",
          state.enemy.hp,
        );
      }
      return handDealt;
    }
  }

  private toTargetRecord(target: (number | null)[]) {
    // TODO: brush up
    const targetNumbers: Record<ExecuteCombo, number | null> = {
      [ExecuteCombo.ONE]: target[0],
      [ExecuteCombo.TWO]: target[1],
      [ExecuteCombo.THREE]: target[2],
    };
    return targetNumbers;
  }
}
