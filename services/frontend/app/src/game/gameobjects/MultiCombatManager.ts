import Phaser, { Scene } from "phaser";
import type { ICombatView } from "./ICombatView";
import CombatPlayer from "./CombatPlayer";
import CombatEnemy from "./CombatEnemy";
import CombatLayoutManager from "./CombatLayoutManager";
import type { Action } from "../network/IGameSocket";
import {
  CombatEventType,
  CombatPhase,
  CombatResult,
  type CombatActionEvent,
  type CombatState,
} from "../network/CombatTypes";
import MultiCardManager from "./cards/MultiCardManager";
import { ActionType, Direction } from "../network/IGameSocket";
import { EventBus } from "../EventBus";
import { CombatEvent } from "../../utils/utils";
import { ExecuteCombo } from "./CombatExecuteManager";
import { CombatEvents } from "./CombatManager";
import { FIXED_TIME_STEP } from "../scenes/MultiGameManagerScene";

const TICK_MS = (1 / FIXED_TIME_STEP) * 1000;

export default class MultiCombatManager implements ICombatView {
  readonly player: CombatPlayer;
  readonly enemy: CombatEnemy;
  readonly cardManager: MultiCardManager;
  readonly events: Phaser.Events.EventEmitter;
  readonly layoutManager: CombatLayoutManager;
  private latestState: CombatState;
  private latestTick: number;
  private readonly targetNumbers: Record<ExecuteCombo, number | null> = {
    [ExecuteCombo.ONE]: null,
    [ExecuteCombo.TWO]: null,
    [ExecuteCombo.THREE]: null,
  };
  private busy = false;
  private eventQueue: CombatActionEvent[] = [];
  private playerTimer: { start: number; end: number } | null = null;

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
    this.latestState = state;
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

  isBusy() {
    return this.busy;
  }

  setLatestTick(tick: number) {
    this.latestTick = tick;
  }

  resync(state: CombatState) {
    this.latestState = state;
    this.eventQueue = [];
    this.syncWithState(state);
    this.updatePlayerTimer(state.phase, state.turn_started_at_tick, state.turn_ends_at_tick);
  }

  private syncWithState(state: CombatState) {
    this.cardManager.syncHand(state.hand);
    this.updateTargetNumbers(state.target_numbers);
    this.player.status.hitPoint = state.player.hp;
    this.player.status.mana = state.player.mp;
    this.enemy.hitPoint = state.enemy.hp;
  }

  handleEvents(events: CombatActionEvent[], state: CombatState) {
    this.latestState = state;
    this.eventQueue.push(...events);
    if (this.busy) {
      return;
    }
    void this.playNextEvent();
  }

  private async playNextEvent() {
    const event = this.eventQueue.shift();
    if (!event) {
      this.busy = false;
      return;
    }
    this.busy = true;
    await this.play(event);
    this.playNextEvent();
  }

  private async play(event: CombatActionEvent) {
    switch (event.type) {
      case CombatEventType.TURN_STARTED:
        this.updatePlayerTimer(event.phase, event.tick, event.turn_ends_at_tick);
        return;
      case CombatEventType.HAND_DEALT:
        this.cardManager.syncHand(event.hand);
        this.updateTargetNumbers(event.target_numbers);
        this.player.status.mana = event.player.mp;
        await this.waitFor(CombatEvents.COMPLETEFILLHAND);
        return;
      case CombatEventType.PLAYER_ATTACK:
        const enemyTakeDamage = this.waitFor(CombatEvents.TAKEDAMAGE);
        this.events.emit(CombatEvents.PLAYERATTACK, this.toExecuteCombo(event.combo));
        await enemyTakeDamage;
        this.enemy.hitPoint = event.enemy.hp;
        return;
      case CombatEventType.PLAYER_GUARD:
        const ended = this.waitFor(CombatEvents.ENDTURN);
        this.events.emit(CombatEvents.PLAYERGUARD);
        await ended;
        return;
      case CombatEventType.ENEMY_ATTACK:
        const playerTakeDamage = this.waitFor(CombatEvents.TAKEDAMAGE);
        this.events.emit(CombatEvents.ENEMYATTACK);
        await playerTakeDamage;
        this.player.status.hitPoint = event.player.hp;
        return;
      case CombatEventType.PLAY_MISSED:
        return;
      case CombatEventType.ACTION_REJECTED:
        console.warn(`[combat] ${event.action} rejected: ${event.reason}`);
        return;
      case CombatEventType.COMBAT_END:
        this.updatePlayerTimer(CombatPhase.OVER, event.tick, null);
        // TODO:
        if (event.result == CombatResult.WIN) {
          this.events.emit(CombatEvents.ENDCOMBAT);
        } else {
          this.events.emit(CombatEvents.ENDGAME);
        }
        return;
    }
  }

  private waitFor(event: CombatEvents): Promise<void> {
    return new Promise((resolve) => {
      const done = () => {
        this.events.off(event, done);
        resolve();
      };
      this.events.once(event, done);
    });
  }

  private toExecuteCombo(combo: number) {
    return (combo - 1) as ExecuteCombo;
  }

  private updatePlayerTimer(phase: CombatPhase, start: number | null, end: number | null) {
    if (phase === CombatPhase.PLAYER_TURN && start && end) {
      this.playerTimer = { start, end };
      this.sendElapsedPlayerTime();
    } else {
      this.playerTimer = null;
      EventBus.emit(CombatEvent.turnEnded);
    }
  }

  private updateTargetNumbers(target: (number | null)[]) {
    this.targetNumbers[ExecuteCombo.ONE] = target[ExecuteCombo.ONE];
    this.targetNumbers[ExecuteCombo.TWO] = target[ExecuteCombo.TWO];
    this.targetNumbers[ExecuteCombo.THREE] = target[ExecuteCombo.THREE];
  }

  sendInitPlayerHP() {
    EventBus.emit(CombatEvent.initPlayerHP, this.latestState.player.max_hp);
  }

  sendInitPlayerMP() {
    EventBus.emit(CombatEvent.initPlayerMP, this.latestState.player.mp);
  }

  sendInitEnemyHP() {
    EventBus.emit(CombatEvent.initEnemyHP, this.latestState.enemy.max_hp);
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
    if (!this.playerTimer) {
      return;
    }
    const { start, end } = this.playerTimer;
    const totalMs = (end - start) * TICK_MS;
    const elapsedMs = Math.min(totalMs, (this.latestTick - start) * TICK_MS);
    EventBus.emit(CombatEvent.initTurn, totalMs, elapsedMs);
  }
}
