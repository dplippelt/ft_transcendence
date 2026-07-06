import Phaser from "phaser";
import { Assets, AssetsKey } from "../Assets";

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super("preload");
  }

  preload() {
    // load game assets
    this.load.spritesheet(AssetsKey.Player, Assets[AssetsKey.Player], {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet(AssetsKey.Skeleton, Assets[AssetsKey.Skeleton], {
      frameWidth: 16,
      frameHeight: 16,
    });
  }

  create() {
    this.scene.start("game");
  }
}
