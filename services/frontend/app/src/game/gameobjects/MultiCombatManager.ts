import Phaser, { Scene } from "phaser";
import type { ICombatView } from "./ICombatView";
import CombatPlayer from "./CombatPlayer";
import CombatEnemy from "./CombatEnemy";
import CombatLayoutManager from "./CombatLayoutManager";
import type { IGameSocket } from "../network/IGameSocket";
import type { CombatState } from "../network/CombatTypes";
import MultiCardManager from "./cards/MultiCardManager";
import { ActionType, Direction } from "../network/GameSocket";
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

  sendRedraw() {}

  applyState(state: CombatState, ackSequence: number) {
    this.latestState = state;
    if (this.pendingSequence !== null && ackSequence >= this.pendingSequence) {
      this.pendingSequence = null;
      this.cardManager.lockSelection(false);
    }
    this.emitStatusToUI(state);
  }

  private emitStatusToUI(state: CombatState) {
    EventBus.emit(CombatEvent.updatePlayerHP, state.player.hp);
    EventBus.emit(CombatEvent.updatePlayerMP, state.player.mp);
    EventBus.emit(CombatEvent.updateEnemyHP, state.enemy.hp);
    EventBus.emit(CombatEvent.updateTargetNumbers, toTargetRecord(state.target_numbers));
  }

  destroy() {
    /* destroy visuals, remove listeners */
  }
}

function toTargetRecord(target: (number | null)[]) {
  // TODO
  const targetNumbers: Record<ExecuteCombo, number | null> = {
    [ExecuteCombo.ONE]: target[0],
    [ExecuteCombo.TWO]: target[1],
    [ExecuteCombo.THREE]: target[2],
  };
  return targetNumbers;
}
