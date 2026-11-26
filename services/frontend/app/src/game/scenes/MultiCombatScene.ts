import Phaser, { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { CombatEvent } from "../../utils/utils";
import MultiCombatManager from "../gameobjects/MultiCombatManager";
import { CombatPhase, type CombatState } from "../network/CombatTypes";
import type { INetworkScene } from "../network/INetworkScene";
import { ActionType, type Action } from "../network/IGameSocket";

const MAX_QUEUED_EVENTS = 10; // more than this behind -> skip animations

export default class MultiCombatScene extends Scene implements INetworkScene {
  state: CombatState | null = null;
  private combatManager!: MultiCombatManager;
  private pendingAction: Action | null = null;
  private pendingSequence: number | null = null;
  private lastEventSequence: number = 0;

  constructor() {
    super("MultiCombatScene");
  }

  create(data: { state: CombatState; tick: number }) {
    this.combatManager = new MultiCombatManager(this, data.state, data.tick);
    this.pendingAction = null;
    this.pendingSequence = null;
    this.lastEventSequence = 0;
    this.applyState(data.state, 0, data.tick);

    const listeners = this.activateUIActions();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.removeUIListeners(listeners);
    });

    EventBus.emit("current-scene-ready", this);
  }

  nextAction(): Action | null {
    const action = this.pendingAction;
    this.pendingAction = null;
    return action;
  }

  onActionSent(action: Action, seq: number): void {
    if (action.type === ActionType.NONE) {
      return;
    }
    this.pendingSequence = seq;
  }

  applyState(state: CombatState, ackSequence: number, tick: number) {
    this.state = state;
    if (this.pendingSequence !== null && ackSequence >= this.pendingSequence) {
      this.pendingSequence = null;
    }
    this.combatManager.setLatestTick(tick);
    const newEvents = state.events.filter((e) => e.seq > this.lastEventSequence);
    const numEvents = newEvents.length;
    if (numEvents === 0) {
      this.updateInputEnabled();
      return;
    }
    const missed = newEvents[0].seq > this.lastEventSequence + 1;
    this.lastEventSequence = newEvents[numEvents - 1].seq;

    if (missed || document.hidden || numEvents > MAX_QUEUED_EVENTS) {
      this.combatManager.resync(state);
    } else {
      this.combatManager.handleEvents(newEvents);
    }
    this.updateInputEnabled();
  }

  private updateInputEnabled() {
    this.input.enabled = this.canAct();
  }

  private canAct() {
    return (
      this.state?.phase === CombatPhase.PLAYER_TURN &&
      this.pendingAction === null &&
      this.pendingSequence === null &&
      !this.combatManager.isBusy()
    );
  }

  private activateUIActions() {
    const m = this.combatManager;
    const listeners: [string, () => void][] = [
      [
        CombatEvent.attack,
        () => {
          if (!this.canAct()) {
            return ;
          }
          this.pendingAction = m.sendPlayCards();
          this.updateInputEnabled();
        },
      ],
      [
        CombatEvent.draw,
        () => {
          // TODO: reject when it cannot act and enable the draw button
          this.pendingAction = m.sendRedraw();
          this.updateInputEnabled();
        },
      ],
      [CombatEvent.getInitPlayerHp, () => m.sendInitPlayerHP()],
      [CombatEvent.getInitPlayerMp, () => m.sendInitPlayerMP()],
      [CombatEvent.getInitEnemyHp, () => m.sendInitEnemyHP()],
      [CombatEvent.getInitTargetNumbers, () => m.sendInitTargetNumbers()],
      [CombatEvent.getCurrPlayerHp, () => m.sendCurrPlayerHP()],
      [CombatEvent.getCurrPlayerMp, () => m.sendCurrPlayerMP()],
      [CombatEvent.getCurrEnemyHp, () => m.sendCurrEnemyHP()],
      [CombatEvent.getCurrTargetNumbers, () => m.sendCurrTargetNumbers()],
      [CombatEvent.getTurnTimerState, () => m.sendElapsedPlayerTime()],
    ];
    for (const [event, handler] of listeners) {
      EventBus.addListener(event, handler);
    }
    return listeners;
  }

  private removeUIListeners(listeners: [string, () => void][]) {
    for (const [event, handler] of listeners) {
      EventBus.removeListener(event, handler);
    }
  }
}
