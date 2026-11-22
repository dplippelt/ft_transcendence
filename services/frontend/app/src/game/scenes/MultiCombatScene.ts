import Phaser, { Scene } from "phaser";
import { GameWsEvent, type GameSnapshot, type IGameSocket } from "../network/IGameSocket";
import { EventBus } from "../EventBus";
import { CombatEvent } from "../../utils/utils";
import MultiCombatManager from "../gameobjects/MultiCombatManager";
import type { CombatState } from "../network/CombatTypes";

export default class MultiCombatScene extends Scene {
  private combatManager!: MultiCombatManager;

  constructor(private readonly socket: IGameSocket) {
    super("MultiCombatScene");
  }

  create(state: CombatState) {
    this.combatManager = new MultiCombatManager(this, this.socket, state);
    this.socket.on(GameWsEvent.SNAPSHOT, this.onSnapshot, this);
    EventBus.addListener(CombatEvent.attack, this.onAttack, this);
    EventBus.addListener(CombatEvent.draw, this.onDraw, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.socket.off(GameWsEvent.SNAPSHOT, this.onSnapshot, this);
      EventBus.removeListener(CombatEvent.attack, this.onAttack, this);
      EventBus.removeListener(CombatEvent.draw, this.onDraw, this);
    });
    EventBus.emit("current-scene-ready", this);
  }

  private onSnapshot(snap: GameSnapshot) {
    const state = snap.combat.find((combat) => combat.player_id === snap.user_player_id);
    if (!state) {
      return;
    }
    const me = snap.players.find((p) => p.player_id === snap.user_player_id);
    this.combatManager.applyState(state, me?.sequence ?? 0);
  }

  onAttack() {
    this.combatManager?.sendPlayCards();
  }

  onDraw() {
    this.combatManager?.sendRedraw();
  }
}
