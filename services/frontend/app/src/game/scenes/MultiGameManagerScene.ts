import Phaser, { Scene } from "phaser";
import GameSocket, { type SocketListener } from "../network/GameSocket";
import MultiGameScene from "./MultiGameScene";
import { GameEvent, RegistryKey, type GameURL } from "../../utils/utils";
import {
  ActionType,
  Direction,
  GameWsEvent,
  type Action,
  type DisconnectInfo,
  type GameSnapshot,
} from "../network/IGameSocket";
import MultiCombatScene from "./MultiCombatScene";
import { EventBus } from "../EventBus";
import type { CombatState } from "../network/CombatTypes";

const NONE_ACTION: Action = {
  type: ActionType.NONE,
  direction: Direction.NONE,
  card: 0,
  cards: [],
};

const MAX_TICKS_PER_FRAME: number = 5; // avoid a "spiral of death" after the tab was hidden

export class MultiGameManagerScene extends Scene {
  private _gameSocket: GameSocket | null = null;
  private _gameScene: MultiGameScene | null = null;
  private _combatScene: MultiCombatScene | null = null;
  private _combatId: string | null = null;
  private _fixedTimeStep: number | null = null;
  private _elapsedTime: number = 0;

  constructor() {
    super("multi-game-manager");
  }

  init() {
    const gameURL = this.registry.get(RegistryKey.gameURL) as GameURL;
    const sessionId = gameURL.sessionId!;
    const userId = this.registry.get(RegistryKey.userId) as number;

    this._gameSocket = new GameSocket(userId, sessionId);
    if (this._gameSocket) {
      const listeners = this.activateGameSocketListeners(this._gameSocket);
      this.events.once(Phaser.Scenes.Events.DESTROY, () => {
        this.removeGameSocket(this._gameSocket!, listeners);
      });
    }
  }

  private activateGameSocketListeners(socket: GameSocket) {
    const listeners: SocketListener[] = [
      [GameWsEvent.SNAPSHOT, (snap: GameSnapshot) => this.onSnapshot(snap)],
      [GameWsEvent.DISCONNECTED, (info: DisconnectInfo) => this.onSocketDisconnected(info)],
    ];
    for (const [event, handler] of listeners) {
      socket.on(event, handler);
    }
    return listeners;
  }

  private removeGameSocket(socket: GameSocket, listeners: SocketListener[]) {
    for (const [event, handler] of listeners) {
      socket.off(event, handler);
    }
    socket.close();
  }

  create() {
    const keepAlive = window.setInterval(() => {
      if (document.hidden && this._gameSocket?.isOpen) {
        this._gameSocket.sendAction(NONE_ACTION);
      }
    }, 1000);
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      window.clearInterval(keepAlive);
    });
  }

  update(time: number, delta: number) {
    const socket = this._gameSocket;
    if (!socket?.isOpen || !this._fixedTimeStep) {
      return;
    }
    void time;
    this._elapsedTime += delta / 1000;
    let ticks = 0;
    while (this._elapsedTime >= this._fixedTimeStep && ticks < MAX_TICKS_PER_FRAME) {
      this._elapsedTime -= this._fixedTimeStep;
      this.fixedTick();
      ticks++;
    }
    if (ticks === MAX_TICKS_PER_FRAME) {
      this._elapsedTime = 0;
    }
  }

  private fixedTick() {
    // TODO: read input from KeyboardComponent and do client-sie prediction
    const socket = this._gameSocket;
    if (!socket?.isOpen) {
      return;
    }
    const scene = this.activeScene();
    const action = scene?.nextAction() ?? NONE_ACTION;
    const sequence = socket.sendAction(action)!;
    scene?.onActionSent(action, sequence);
  }

  private activeScene() {
    if (this._combatScene && this.scene.isActive(this._combatScene)) {
      return this._combatScene;
    }
    if (this._gameScene && this.scene.isActive(this._gameScene)) {
      return this._gameScene;
    }
    return null;
  }

  private onSnapshot(snapshot: GameSnapshot) {
    if (!this._fixedTimeStep) {
      this._fixedTimeStep = 1 / snapshot.ticks_per_second;
    }
    const me = snapshot.players.find((p) => p.player_id === snapshot.user_player_id);
    const ackSequence = me?.sequence ?? 0;

    // MultiGameScene starts with the first snapshot
    if (!this._gameScene) {
      this._gameScene = new MultiGameScene();
      this.scene.add("MultiGameScene", this._gameScene, true, snapshot);
    } else if (this.scene.isActive(this._gameScene)) {
      this._gameScene.applyState(snapshot);
    }

    // Open the combat scene the first the our combat shows up.
    // TODO: (Closing it / switching back to the dungeon comes with MultiGameScene.)
    const state = snapshot.combat.find((combat) => combat.player_id === snapshot.user_player_id);
    if (!state) {
      // TODO: when coming back from a combat, the game scene restarts
      return;
    }

    if (state.combat_id !== this._combatId) {
      this.startCombatScene(state, snapshot.tick_id);
    } else if (this._combatScene && this.scene.isActive(this._combatScene)) {
      this._combatScene.applyState(state, ackSequence, snapshot.tick_id);
    } else if (this._combatId !== null) {
      this.endCombatScene();
    }
  }

  private startCombatScene(state: CombatState, tick: number) {
    this._combatId = state.combat_id;
    const data = { state, tick };
    if (!this._combatScene) {
      this._combatScene = new MultiCombatScene();
      this.scene.add("MultiCombatScene", this._combatScene, true, data);
    } else {
      this.scene.stop(this._combatScene); // shutdown: objects destroyed, socket listener removed
      this.scene.launch(this._combatScene, data); // create() runs again with the new combat
    }
    this.scene.bringToTop(this._combatScene);
    this.scene.sleep(this._gameScene!);
    EventBus.emit(GameEvent.inCombat, true); // show the React CombatUI
  }

  private endCombatScene() {
    this._combatId = null;
    if (this._combatScene) {
      this.scene.stop(this._combatScene);
    }
    this.scene.wake(this._gameScene!);
    EventBus.emit(GameEvent.inCombat, false);
    // TODO: if lost (player not ALIVE), game over
  }

  private onSocketDisconnected(info: DisconnectInfo) {
    console.warn(`Game socket disconnected (code =${info.code}, reason=${info.reason})`);
    //TODO: error display / return to the lobby
  }
}
