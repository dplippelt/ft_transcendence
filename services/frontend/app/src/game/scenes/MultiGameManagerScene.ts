import Phaser, { Scene } from "phaser";
import GameSocket from "../network/GameSocket";
import MultiGameScene from "./MultiGameScene";
import { GameEvent, RegistryKey, type GameURL } from "../../utils/utils";
import { FakeGameSocket, type IGameSocket } from "../network/IGameSocket";
import MultiCombatScene from "./MultiCombatScene";
import { EventBus } from "../EventBus";

export class MultiGameManagerScene extends Scene {
  private _gameSocket: GameSocket | null = null;
  private _multiGameScene: MultiGameScene | null = null;
  private _multiCombatScene: MultiCombatScene | null = null;

  constructor() {
    super("multi-game-manager");
  }

  init() {
    const gameURL = this.registry.get(RegistryKey.gameURL) as GameURL;
    const sessionId = gameURL.sessionId!;
    const userId = this.registry.get(RegistryKey.userId) as number;

    this._gameSocket = new GameSocket(userId, sessionId);
    this._gameSocket.on("disconnected", this.onSocketDisconnected, this);

    this._multiGameScene = new MultiGameScene(this._gameSocket);
    this.scene.add("MultiGameScene", this._multiGameScene, true);

    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this._gameSocket?.off("disconnected", this.onSocketDisconnected, this);
      // this._gameSocket?.close();
      this._gameSocket = null;
    });

    // Debug
    const fakeSocket: IGameSocket = new FakeGameSocket(userId);
    this._multiCombatScene = new MultiCombatScene(fakeSocket);
    this.scene.add("MultiCombatScene", this._multiCombatScene, true);
    EventBus.emit(GameEvent.inCombat, true);
  }

  create() {}

  private onSocketDisconnected() {
    //TODO: error display / return to the lobby
  }
}
