import { Scene } from "phaser";
import Player from "../../../src/game/gameobjects/Player";
import { playerOne } from "../../../src/game/components/KeyboardComponent";

export default class PlayerTestScene extends Scene {
  player!: Player;

  constructor() {
    super("player-test-scene");
  }

  preload() {
    // Do not load in the Assets
  }

  create() {
    this.player = new Player(this, 0, 0, playerOne);
    this.add.existing(this.player);
    this.physics.add.existing(this.player);
  }
}
