import Phaser, { Scene } from "phaser";
import type { GameSnapshot, IGameSocket } from "../network/IGameSocket";
import { EventBus } from "../EventBus";
import { CombatEvent } from "../../utils/utils";
import MultiCombatManager from "../gameobjects/MultiCombatManager";

export default class MultiCombatScene extends Scene {
  private combatManager!: MultiCombatManager;
  private combatId: string | null = null;

  constructor(private readonly socket: IGameSocket) {
    super("MultiCombatScene");
  }

  create() {
    this.socket.on("game.snapshot", this.onSnapshot, this);

    EventBus.addListener(CombatEvent.attack, this.onAttack, this);
    EventBus.addListener(CombatEvent.draw, this.onDraw, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.socket.off("game.snapshot", this.onSnapshot, this);
      EventBus.removeListener(CombatEvent.attack, this.onAttack, this);
      EventBus.removeListener(CombatEvent.draw, this.onDraw, this);
      this.combatManager?.destroy();
    });
    EventBus.emit("current-scene-ready", this);
  }

  private onSnapshot(snap: GameSnapshot) {
    const state = snap.combat[0]; // later: find by user_id
    if (!state) {
      return;
    }
    const me = snap.players.find((p) => p.player_id === snap.user_player_id);

    if (!this.combatManager || state.combat_id !== this.combatId) {
      this.combatManager?.destroy();
      this.combatManager = new MultiCombatManager(this, this.socket, state);
      this.combatId = state.combat_id;
    } else {
      this.combatManager.applyState(state, me?.sequence ?? 0);
    }
  }
  onAttack() {
    this.combatManager?.sendPlayCards();
  }
  onDraw() {
    this.combatManager?.sendRedraw();
  }
}
