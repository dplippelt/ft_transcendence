import Phaser from "phaser";
import { getWsUrl } from "../../api/http";
import {
  GameWsEvent,
  GameWsMessageType,
  WsEvent,
  type Action,
  type DisconnectInfo,
  type GameSnapshot,
  type IGameSocket,
} from "./IGameSocket";

export default class GameSocket extends Phaser.Events.EventEmitter implements IGameSocket {
  private readonly websocket: WebSocket;
  private readonly gameId: string;
  private nextSequence: number = 1;
  private closedByClient: boolean = false;
  //   private lastSentAt: number = 0;

  constructor(userId: number, gameId: string) {
    super();
    this.gameId = gameId;
    // TODO: drop {userId} once the backend uses token auth
    this.websocket = new WebSocket(getWsUrl(`/game/ws/join/${gameId}/${userId}`));
    this.websocket.addEventListener(WsEvent.OPEN, this.onOpen);
    this.websocket.addEventListener(WsEvent.MESSAGE, this.onMessage);
    this.websocket.addEventListener(WsEvent.CLOSE, this.onClose);
    this.websocket.addEventListener(WsEvent.ERROR, this.onError);
  }

  get isOpen() {
    return this.websocket.readyState === WebSocket.OPEN;
  }

  sendAction(action: Action) {
    if (!this.isOpen) {
      return null;
    }
    const seq = this.nextSequence++;
    this.websocket.send(
      JSON.stringify({
        type: GameWsMessageType.PLAYER_ACTION,
        game_id: this.gameId,
        sequence: seq,
        action: action,
      }),
    );
    // this.lastSentAt = performance.now();
    return seq;
  }

  close() {
    if (this.closedByClient) {
      return;
    }
    this.closedByClient = true;
    this.websocket.removeEventListener(WsEvent.OPEN, this.onOpen);
    this.websocket.removeEventListener(WsEvent.MESSAGE, this.onMessage);
    this.websocket.removeEventListener(WsEvent.CLOSE, this.onClose);
    this.websocket.removeEventListener(WsEvent.ERROR, this.onError);
    this.websocket.close(1000, "client closed");
    this.removeAllListeners();
  }

  private onOpen = () => {
    this.emit(GameWsEvent.OPEN);
  };

  private onMessage = (event: MessageEvent) => {
    let message: GameSnapshot;
    try {
      message = JSON.parse(event.data) as GameSnapshot;
    } catch {
      console.warn("GameSocket: invalid JSON", event.data);
      return;
    }
    if (typeof message.type !== "string") {
      return;
    }
    message.receivedAt = performance.now();
    this.emit(GameWsEvent.MESSAGE, message);
  };

  private onClose = (event: CloseEvent) => {
    const info: DisconnectInfo = { code: event.code, reason: event.reason };
    this.emit(GameWsEvent.DISCONNECTED, info);
  };

  private onError = (event: Event) => {
    console.error("GameSocket error", event);
  };
}
