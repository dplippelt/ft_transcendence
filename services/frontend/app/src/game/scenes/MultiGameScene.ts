import { Scene } from "phaser";
import GameSocket from "../network/GameSocket";

export default class MultiGameScene extends Scene {
  private readonly gameSocket: GameSocket;

  constructor(gameSocket: GameSocket) {
    super("MultiGameScene");
    this.gameSocket = gameSocket;
  }
}
