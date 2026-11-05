import Phaser, { Scene } from "phaser";
import GameSocket from "../network/GameSocket";
import MultiGameScene from "./MultiGameScene";
import { RegistryKey, type GameURL } from "../../utils/utils";

export class MultiGameManagerScene extends Scene {
    private _gameSocket: GameSocket | null = null;
    private _multiGameScene: MultiGameScene | null = null;

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
        })
    }

    create() {

    }

    private onSocketDisconnected() {
        //TODO: error display / return to the lobby
    }
}