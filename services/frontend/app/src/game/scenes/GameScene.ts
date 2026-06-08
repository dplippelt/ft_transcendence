import { Scene } from "phaser";
import { AssetsKey } from "../Assets";
import { EventBus } from "../EventBus";
import Player from "../gameobjects/Player";
import { playerOne } from "../components/KeyboardComponent";

export default class GameScene extends Scene {
  constructor() {
    super("game");
  }

  preload() {
    // load in scene specific assets
  }

  create() {
    const skeleton = this.add.image(400, 300, AssetsKey.Skeleton);

    const player = new Player(this, 40, 40, playerOne);
    this.add.existing(player);
    this.physics.add.existing(player);

    this.tweens.add({
      targets: [skeleton],
      x: "random(0, 600)",
      y: "random(0, 500)",
      ease: "Cubic.easeIn",
      repeat: -1,
      yoyo: true,
      duration: 2000,
    });

    EventBus.emit('current-scene-ready', this);

    // Temporarily added to launch the combat scene by clicking the screen
    this.input.on('pointerdown', () => {

        this.scene.sleep().launch('combat');

    })
  }
}
