import Phaser from "phaser";

enum ActionType {
    NONE,
    MOVE,
    PICK_CARD,
    DRAW_CARD,
    PLAY_CARDS,
    LEAVE,
}

enum Direction {
    UP,
    RIGHT,
    DOWN,
    LEFT,
}

interface Action {
    type: ActionType,
    direction: Direction,
    card: number,
}

// class ActionType(IntEnum):
//     NONE = 0
//     MOVE = auto()
//     PICK_CARD = auto()
//     DRAW_CARD = auto()
//     PLAY_CARDS = auto()
//     LEAVE = auto()


// class Direction(IntFlag):
//     UP = auto()
//     RIGHT = auto()
//     DOWN = auto()
//     LEFT = auto()


// class Action(BaseModel):
//     type: ActionType
//     direction: Direction
//     card: int


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
}


export default class GameSocket extends Phaser.Events.EventEmitter {
  private websocket: WebSocket;
  private user_id: number;
  private game_id: string;
  private nextSequence: number;;

  constructor(user_id: number, game_id: string) {
    super();
    this.user_id = user_id;
    this.game_id = game_id;
    this.websocket = new WebSocket(`ws://localhost:8000/game/ws/join/${this.game_id}/${this.user_id}`);
    this.websocket.addEventListener("message", this.get_game_state, {once: true});
    this.websocket.addEventListener("open", this.ping_back_and_close, {once: true});
    this.nextSequence = 1;
    this.websocket.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        msg.receiveAt = performance.now(); // needed for interpolation
        this.emit(msg.type, msg);
    }; // "game.snapshot", "game.level", ...
    this.websocket.onclose = () => this.emit("disconnected");
  }

  private sendAction(action: Action) {
    const seq = this.nextSequence++;
    this.websocket.send(JSON.stringify({
        type: "game.player.action", game_id: this.game_id, sequence: seq, action: action
    }));
    return seq;
  }

  private get_game_state = (event: MessageEvent) => {
    const message = JSON.parse(event.data) as GameSnapshot;
    console.log("original: ", event.data);
    console.log("First message:", message);
    console.log("type: ", message.type);
    console.log("game_id", message.game_id);
  }

  private ping_back_and_close = () => {
    const response = {
      "type": "game.player.action",
      "game_id": this.game_id,
      "sequence": 1,
      "action": {
        type: 5,
        direction: 0,
        card: 0
      }
    };
    console.log(`User ${this.user_id} sending a action`);
    if (this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(response));
    } else {
      console.log(`Websocket is ${this.websocket.readyState}`);
    }

    const waitFor = new Promise<boolean>((resolve) => {
      setTimeout(resolve, 5000);
    });
    waitFor.then(() => {
      console.log(`CLOSING SOCKET ${this.user_id}!!`);
      this.websocket.close();
    })
  }
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
