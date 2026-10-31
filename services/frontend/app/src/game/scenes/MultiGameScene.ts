import { Scene } from "phaser";
import GameSocket from "../network/GameSocket";

export default class MultiGameScene extends Scene {
  private readonly gameSocket: GameSocket;

  constructor(user_id: number, game_session_id: string) {
    super("multi-game");
    this.gameSocket = new GameSocket(user_id, game_session_id);
  }
}
