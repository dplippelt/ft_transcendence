import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import Player from "../gameobjects/Player";
import { playerOne } from "../components/KeyboardComponent";
import { Dungeon } from "../gameobjects/Dungeon";
import { FloorType, Direction, type DungeonConfig } from "../map/procedural";

const dungeonConfig: DungeonConfig = {
  emptyRoomConfig: {
    doorCount: { min: 2, max: 4 },
    width: { min: 5, max: 9 },
    height: { min: 5, max: 9 },
    tileMapping: {
      corners: {
        [Direction.TopLeft]: 2,
        [Direction.TopRight]: 5,
        [Direction.DownLeft]: 41,
        [Direction.DownRight]: 44,
      },
      innerCorners: {
        [Direction.TopLeft]: 16,
        [Direction.TopRight]: 17,
        [Direction.DownLeft]: 29,
        [Direction.DownRight]: 30,
      },
      walls: {
        [Direction.Top]: [3, 4],
        [Direction.Right]: [18, 18, 31],
        [Direction.Down]: [42, 43],
        [Direction.Left]: [15, 15, 28],
      },
      floor: {
        [FloorType.default]: [
          { index: 0, weight: 20 },
          { index: 1, weight: 4 },
          { index: 13, weight: 2 },
          { index: 14, weight: 8 },
          { index: 26, weight: 0.5 },
          { index: 27, weight: 0.5 },
        ],
      },
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
