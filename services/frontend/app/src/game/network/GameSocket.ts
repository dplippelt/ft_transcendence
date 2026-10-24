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

// Debug class for testing socket connections
class GameSocket {
  private websocket: WebSocket;
  private user_id: number;
  private game_id: string;

  constructor(user_id: number, game_id: string) {
    this.user_id = user_id;
    this.game_id = game_id;
    this.websocket = new WebSocket(`ws://localhost:8000/game/ws/join/${game_id}/${user_id}`);
    this.websocket.addEventListener("message", this.get_game_state, {once: true});
    this.websocket.addEventListener("open", this.ping_back_and_close, {once: true});
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

let player_0: GameSocket;
let player_1: GameSocket;
let g_game_id: string | undefined = undefined;

export function call_create_session() {
  if (g_game_id !== undefined) {
    make_connection({ "game_id": g_game_id });
    // g_game_id = undefined; // undo comment if you want to cycle through different sessions
    return;
  }

  console.log("calling create session");
  fetch("http://localhost:8000/game/create", {method: "POST"})
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      return response.json();
    })
    .then((json) => make_connection(json))
    .catch((err) => console.error(`Fetch problem: ${err.message}`));
}

function make_connection(json) {
  console.log(json);
  g_game_id = json.game_id;
  player_0 = new GameSocket(0, json.game_id);
  player_1 = new GameSocket(1, json.game_id);
}
