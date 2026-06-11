import Phaser from "phaser";
import { Assets } from "../Assets";

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super("preload");
  }

  preload() {
    // load game assets
    this.load.spritesheet(Assets.player.key, Assets.player.url, {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet(Assets.skeleton.key, Assets.skeleton.url, {
      frameWidth: 16,
      frameHeight: 16,
    });
  }

  create() {
    this.scene.start("game");
  }
}
