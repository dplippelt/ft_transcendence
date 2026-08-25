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
  roomCount: { min: 8, max: 16 },
};

// Websocket testing code
let socket: WebSocket;

function call_create_session() {
  console.log("calling create session");
  fetch("http://localhost:8000/game/create", {method: "POST"})
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      return response.json();
    })
    .then((json) => connect_to_session(json))
    .catch((err) => console.error(`Fetch problem: ${err.message}`));
}

type GameSnapshot = {
  type: string;
  game_id: string;
  tick_id: integer;
  state: string;
  dungeon_seed: integer;
  user_player_id: integer;
  players: [unknown];
  enemies: [unknown];
  combat: [unknown];
}

// @ts-expect-error TS7006: ssssh...;
function connect_to_session(json) {
  console.log(json);
  socket = new WebSocket(`ws://localhost:8000/game/ws/join/${json.game_id}`);
  socket.addEventListener("message", (event) => {
    // Retrieve message
    const message = JSON.parse(event.data) as GameSnapshot;
    console.log("original: ", event.data);
    console.log("First message:", message);
    console.log("type: ", message.type);
    console.log("game_id", message.game_id);

    // leave the game :-)
    const response = {
      "type": "game.player.action",
      "game_id": message.game_id,
      "sequence": 1,
      "action": {
        type: 5,
        direction: 0,
        card: 0
      }
    };
    socket.send(JSON.stringify(response));
    socket.close(1000, "Done");
  }, { once: true });
}
// End of websocket testing code

// TODO: GameSession structure (local / network) -> thruth sayer; player hp, position etc, syncs up with the game itself
export default class GameScene extends Scene {
  private _dungeon!: Dungeon;

  constructor() {
    super("game");
  }

  preload() {
    // load in scene specific assets
  }

  create() {
    this._dungeon = new Dungeon(this, dungeonConfig, 1.5);
    this.cameras.main.startFollow(this.getPlayerOne());

    // Temporarily mouse event for map generation
    this.input.on("pointerdown", () => {
      if (this.input.activePointer.leftButtonDown()) {
        this.nextLevel();
      }

      if (this.input.activePointer.rightButtonDown()) {
        call_create_session()
      }
    });

    EventBus.emit("current-scene-ready", this);
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

  nextLevel(): void {
    this.cameras.main.stopFollow();
    this._dungeon.build(dungeonConfig, 1.5);
    this.cameras.main.startFollow(this.getPlayerOne());
  }
}
