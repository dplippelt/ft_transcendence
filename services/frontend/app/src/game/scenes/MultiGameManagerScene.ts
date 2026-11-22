import Phaser, { Scene } from "phaser";
import GameSocket from "../network/GameSocket";
import MultiGameScene from "./MultiGameScene";
import { GameEvent, RegistryKey, type GameURL } from "../../utils/utils";
import { ActionType, Direction, GameWsEvent, type DisconnectInfo, type GameSnapshot } from "../network/IGameSocket";
import MultiCombatScene from "./MultiCombatScene";
import { EventBus } from "../EventBus";

export class MultiGameManagerScene extends Scene {
  private _gameSocket: GameSocket | null = null;
  private _gameScene: MultiGameScene | null = null;
  private _combatId: string | null = null;
  private _combatScene: MultiCombatScene | null = null;

  constructor() {
    super("multi-game-manager");
  }

  init() {
    const gameURL = this.registry.get(RegistryKey.gameURL) as GameURL;
    const sessionId = gameURL.sessionId!;
    const userId = this.registry.get(RegistryKey.userId) as number;

    this._gameSocket = new GameSocket(userId, sessionId);
    this._gameSocket.on(GameWsEvent.MESSAGE, this.onSnapshot, this);
    this._gameSocket.on(GameWsEvent.DISCONNECTED, this.onSocketDisconnected, this);

    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      if (this._gameSocket) {
        this._gameSocket.off(GameWsEvent.MESSAGE, this.onSnapshot, this);
        this._gameSocket.off(GameWsEvent.DISCONNECTED, this.onSocketDisconnected, this);
        this._gameSocket.close();
        this._gameSocket = null;
      }
    });
  }

  create() {
    // Heartbeat: send NONE when nothing was sent for a while.
    // TODO: Replaced by one action per tick once MultiGameScene sends movement.
    this.time.addEvent({
        delay: 1000,
        loop: true,
        callback: () => {
            const socket = this._gameSocket;
            if (socket?.isOpen && performance.now() - socket.lastSentAt >= 1000) {
                socket.sendAction({
                    type: ActionType.NONE,
                    direction: Direction.NONE,
                    card: 0,
                    cards: [],
                });
            }
        },
    });
  }

  private onSnapshot(snapshot: GameSnapshot) {
    // TODO: Start MultiGameScene from the first snapshot (dungeon_seed, players, enemies),
    if (!this._gameScene) {
      this._gameScene = new MultiGameScene(this._gameSocket!);
      this.scene.add("MultiGameScene", this._gameScene, true);
    }

    // Open the combat scene the first the our combat shows up.
    // TODO: (Closing it / switching back to the dungeon comes with MultiGameScene.)
    const state = snapshot.combat.find((combat) => combat.player_id === snapshot.user_player_id);
    if (!state || state.combat_id === this._combatId) {
      return;
    }
    this._combatId = state.combat_id;
    if (!this._combatScene) {
      this._combatScene = new MultiCombatScene(this._gameSocket!);
      this.scene.add("MultiCombatScene", this._combatScene, true, state);
    } else {
      this.scene.stop(this._combatScene); // shutdown: objects destroyed, socket listener removed
      this.scene.launch(this._combatScene, state); // create() runs again with the new combat
    }
    EventBus.emit(GameEvent.inCombat, true); // show the React CombatUI
  }

  private onSocketDisconnected(info: DisconnectInfo) {
    console.warn(`Game socket disconnected (code =${info.code}, reason=${info.reason})`);
    //TODO: error display / return to the lobby
  }
}
