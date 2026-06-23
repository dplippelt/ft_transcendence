import Phaser from "phaser";
import { Assets } from "../Assets";
import { EventBus } from "../EventBus";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("game");
  }

  preload() {
    // load in scene specific assets
  }

  create() {
    const player = this.add.image(400, 300, Assets.player.key);
    const skeleton = this.add.image(400, 300, Assets.skeleton.key);

    this.tweens.add({
      targets: [player, skeleton],
      x: "random(0, 600)",
      y: "random(0, 500)",
      ease: "Cubic.easeIn",
      repeat: -1,
      yoyo: true,
      duration: 2000
    });

    EventBus.emit('current-scene-ready', this);

    // Temporarily added to launch the combat scene by clicking the screen
    this.input.on('pointerdown', () => {

        this.scene.sleep().launch('combat');

    })
  }
}