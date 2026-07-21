import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { Dungeon } from "../gameobjects/Dungeon";
import { FloorType, Direction, type DungeonConfig, WallType } from "../map/procedural";

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
        [Direction.Top]: {
          [WallType.Moss]: 3,
          [WallType.MoreMoss]: 4,
        },
        [Direction.Right]: {
          [WallType.ThinA]: 18,
          [WallType.ThinB]: 18,
          [WallType.Thick]: 31,
        },
        [Direction.Down]: {
          [WallType.Moss]: 42,
          [WallType.MoreMoss]: 43,
        },
        [Direction.Left]: {
          [WallType.ThinA]: 15,
          [WallType.ThinB]: 15,
          [WallType.Thick]: 28,
        },
      },
      floor: {
        [FloorType.Clean]: { index: 0, weight: 20 },
        [FloorType.SmallCracksA]: { index: 1, weight: 4 },
        [FloorType.SmallCracksB]: { index: 13, weight: 2 },
        [FloorType.Cracked]: { index: 14, weight: 8 },
        [FloorType.Damaged]: { index: 26, weight: 0.5 },
        [FloorType.Broken]: { index: 27, weight: 0.5 },
      },
    },
  },
  roomCount: { min: 8, max: 32 },
};


// TODO: GameSession (local / network) -> thruth sayer; player hp, position etc, syncs up with the game itself
export default class GameScene extends Scene {
  constructor() {
    super("game");
  }

  preload() {
    // load in scene specific assets
  }

  create() {
    const map = new Dungeon(this, dungeonConfig, 1.5);

    // Temporarily added to launch the combat scene by clicking the screen
    this.input.on("pointerdown", () => {
      //   this.initiateCombatScene({
      //     player: undefined,
      //     enemy: undefined,
      //     isPlayerDefeated: false,
      //     sceneInvoker: this,
      //   });
      this.cameras.main.stopFollow();
      map.build(dungeonConfig);
      this.cameras.main.startFollow(map.players[0]);
    });
    this.cameras.main.startFollow(map.players[0]);

    EventBus.emit("current-scene-ready", this);
  }
}
