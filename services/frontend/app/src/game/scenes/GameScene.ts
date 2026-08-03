import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { Dungeon } from "../gameobjects/dungeon/Dungeon.ts";
import { Direction, type DungeonConfig } from "../map/procedural";
import { WallType, FloorType, PassageType, FoilageType } from "../map/TileSetMap.ts";
import Player from "../gameobjects/Player.ts";

const dungeonConfig: DungeonConfig = {
  emptyRoomConfig: {
    doorCount: { min: 2, max: 4 },
    width: { min: 5, max: 9 },
    height: { min: 5, max: 9 },
    tileSetMap: {
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
      passages: {
        [PassageType.StairwayUp]: 55,
        [PassageType.StairwayDown]: 56,
        [PassageType.DoorFrontOpen]: 58,
        [PassageType.DoorFrontClosed]: 59,
        [PassageType.DoorSidewayClosed]: 60,
        [PassageType.DoorSidewayOpen]: 61,
        [PassageType.FramedDoorOpen]: 62,
        [PassageType.FramedDoorClosed]: 63,
      },
      foilage: {
        [FoilageType.RedMushroom]: { index: 20, weight: 5},
        [FoilageType.PurpleMushroom]: {index: 33, weight: 2},
        [FoilageType.Grass]: { index: 46, weight: 20 },
      }
    },
  },
  roomCount: { min: 8, max: 8 },
};

// TODO: GameSession structure (local / network) -> thruth sayer; player hp, position etc, syncs up with the game itself
export default class GameScene extends Scene {
  constructor() {
    super("game");
  }

  preload() {
    // load in scene specific assets
  }

  create() {
    const map = new Dungeon(this, dungeonConfig, 1.5);

    // Temporarily mouse event for map generation
    this.input.on("pointerdown", () => {
      this.cameras.main.stopFollow();
      map.build(dungeonConfig);
      this.cameras.main.startFollow(this.getPlayerOne(map));
    });
    this.cameras.main.startFollow(this.getPlayerOne(map));

    EventBus.emit("current-scene-ready", this);
  }

  getPlayerOne(map: Dungeon): Player {
    const player = map.getPlayer(0);
    if (player === undefined) {
      throw new Error("Player missing!")
    }
    return player;
  }
}
