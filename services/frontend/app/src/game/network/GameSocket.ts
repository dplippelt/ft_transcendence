import Phaser from "phaser";
import { getWsUrl } from "../../api/http";

/* ---- Must match backend/app/schemas/game.py ---- */

export enum ActionType {
  NONE = 0,
  MOVE = 1,
  PICK_CARD = 2,
  DRAW_CARD = 3,
  PLAY_CARDS = 4,
  LEAVE = 5,
}

// Python IntFlag + auto() -> 1, 2, 4, 8 (bit flags, so diagonals can be combined)
export enum Direction {
  NONE = 0,
  UP = 1 << 0,
  RIGHT = 1 << 1,
  DOWN = 1 << 2,
  LEFT = 1 << 3,
}

// interface Action {
//   type: ActionType;
//   direction: Direction;
//   card: number;
// }

type GameSnapshot = {
  type: string;
  game_id: string;
  tick_id: number;
  state: string;
  dungeon_seed: number;
  user_player_id: number;
  players: [unknown];
  enemies: [unknown];
  combat: [unknown];
};

export default class GameSocket extends Phaser.Events.EventEmitter {
  private websocket: WebSocket;
  private gameId: string;
  private userId: number;
  private nextSequence: number;

  constructor(userId: number, gameId: string) {
    super();
    this.gameId = gameId;
    this.userId = userId;
    this.websocket = new WebSocket(getWsUrl(`/game/ws/join/${gameId}/${userId}`));
    this.websocket.addEventListener("message", this.get_game_state, { once: true });
    this.websocket.addEventListener("open", this.ping_back_and_close, { once: true });
    this.nextSequence = 1;
    // this.websocket.onmessage = (e) => {
    //     const msg = JSON.parse(e.data);
    //     msg.receiveAt = performance.now(); // needed for interpolation
    //     this.emit(msg.type, msg);
    // }; // "game.snapshot", "game.level", ...
    // this.websocket.onclose = () => this.emit("disconnected");
  }

  //   sendAction(action: Action) {
  //     const seq = this.nextSequence++;
  //     this.websocket.send(JSON.stringify({
  //         type: "game.player.action", game_id: this.game_id, sequence: seq, action: action
  //     }));
  //     return seq;
  //   }

  private get_game_state = (event: MessageEvent) => {
    const message = JSON.parse(event.data) as GameSnapshot;
    console.log("original: ", event.data);
    console.log("First message:", message);
    console.log("type: ", message.type);
    console.log("game_id", message.game_id);
  };

  private ping_back_and_close = () => {
    const response = {
      type: "game.player.action",
      game_id: this.gameId,
      sequence: this.nextSequence++,
      action: {
        type: 5,
        direction: 0,
        card: 0,
      },
    };
    console.log(`User ${this.userId} sending a action`);
    if (this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(response));
    } else {
      console.log(`Websocket is ${this.websocket.readyState}`);
    }

    const waitFor = new Promise<boolean>((resolve) => {
      setTimeout(resolve, 5000);
    });
    waitFor.then(() => {
      console.log(`CLOSING SOCKET ${this.userId}!!`);
      this.websocket.close();
    });
  };
}

// let player_0: GameSocket;
// let player_1: GameSocket;
// let g_game_id: string | undefined = undefined;

// export function call_create_session() {
//   if (g_game_id !== undefined) {
//     make_connection({ "game_id": g_game_id });
//     // g_game_id = undefined; // undo comment if you want to cycle through different sessions
//     return;
//   }

//   console.log("calling create session");
//   fetch("http://localhost:8000/game/create", {method: "POST"})
//     .then((response) => {
//       if (!response.ok) {
//         throw new Error(`HTTP error: ${response.status}`);
//       }
//       return response.json();
//     })
//     .then((json) => make_connection(json))
//     .catch((err) => console.error(`Fetch problem: ${err.message}`));
// }

// function make_connection(json) {
//   console.log(json);
//   g_game_id = json.game_id;
//   player_0 = new GameSocket(0, json.game_id);
//   player_1 = new GameSocket(1, json.game_id);
// }

// void player_0;
// void player_1;
