import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    // load in minimal assets (i.e fonts)
  }

  create() {
    this.scene.start("preload");
  }
}
