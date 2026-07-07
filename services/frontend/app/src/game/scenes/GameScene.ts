import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import Player from "../gameobjects/Player";
import { playerOne } from "../components/KeyboardComponent";
import { Dungeon } from "../gameobjects/Dungeon";
import { type DungeonConfig } from "../map/procedural";

const dungeonConfig: DungeonConfig = {
  emptyRoomConfig: {
    doorCount: { min: 2, max: 4 },
    width: { min: 5, max: 9 },
    height: { min: 5, max: 9 },
    tileMapping: {
      corner: [2, 5, 41, 44],
      innerCorner: [16, 17, 29, 30],
      wall: [
        [3, 4],
        [18, 18, 31],
        [42, 43],
        [15, 15, 28],
      ],
      floor: [
        { index: 0, weight: 20 },
        { index: 1, weight: 4 },
        { index: 13, weight: 2 },
        { index: 14, weight: 8 },
        { index: 26, weight: 0.5 },
        { index: 27, weight: 0.5 },
      ],
    },
  },
  roomCount: { min: 8, max: 32 },
};

export default class GameScene extends Scene {
  constructor() {
    super("game");
  }

  preload() {
    // load in scene specific assets
  }

  create() {
    const player = new Player(this, 40, 40, playerOne);
    this.add.existing(player);
    this.physics.add.existing(player);

    const map = new Dungeon(this, dungeonConfig, 1.5);
    map.insertSprite(player, true);

    // Temporarily added to launch the combat scene by clicking the screen
    this.input.on("pointerdown", () => {
      // this.scene.sleep().launch('combat');
      map.generate(dungeonConfig);
      map.insertSprite(player, true);
    });

    this.cameras.main.startFollow(player);
    EventBus.emit("current-scene-ready", this);
  }
}
