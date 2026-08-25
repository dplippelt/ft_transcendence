import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { Dungeon } from "../gameobjects/dungeon/Dungeon.ts";
import { Direction, type DungeonConfig } from "../map/procedural";
import { WallType, FloorType, PassageType, FoilageType } from "../map/TileSetMap.ts";
import Player from "../gameobjects/Player.ts";
import { GameMode, RegistryKey } from "../../utils/utils.ts";
import { GameObjects } from "phaser";

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
  roomCount: { min: 8, max: 16 },
};

// TODO: GameSession structure (local / network) -> thruth sayer; player hp, position etc, syncs up with the game itself
export default class GameScene extends Scene {
  private _dungeon!: Dungeon;
  private _cameraTarget!: Player | GameObjects.Zone;
  private _gameMode!: GameMode;

  constructor() {
    super("game");
  }

  preload() {
    // load in scene specific assets
  }

  create() {
    this._dungeon = new Dungeon(this, dungeonConfig, 1.5);
    this.setupCamera();

    // Temporarily mouse event for map generation
    this.input.on("pointerdown", () => {
      if (this.input.activePointer.leftButtonDown()) {
        this.nextLevel();
      }
    });

    EventBus.emit("current-scene-ready", this);
  }

  update(): void {
    if ( this._gameMode === GameMode.coop ) {
      const player_1 = this._dungeon.getPlayer(0);
      const player_2 = this._dungeon.getPlayer(1);
      if ( !player_1 || !player_2 )
        throw new Error("Player missing!");

      this._cameraTarget.setPosition(
        (player_1.x + player_2.x) / 2,
        (player_1.y + player_2.y) / 2,
      )
    }
  }

  getPlayerOne(): Player {
    const player = this._dungeon.getPlayer(0);
    if (player === undefined) {
      throw new Error("Player missing!")
    }
    return player;
  }

  getAlivePlayerCount(): number {
    return this._dungeon.getAlivePlayerCount();
  }

  getEnemyCount(): number {
    return this._dungeon.getEnemyCount();
  }

  setupCamera(): void {
    this._gameMode = this._dungeon.scene.registry.get(RegistryKey.mode);
    this._cameraTarget = this._gameMode === GameMode.sp ? this.getPlayerOne() : this.add.zone(0, 0, 1, 1);
    this.cameras.main.startFollow(this._cameraTarget);
  }

  nextLevel(): void {
    this.cameras.main.stopFollow();
    this._dungeon.build(dungeonConfig, 1.5);
    this.setupCamera();
  }
}
