import Phaser from "phaser";
import type { CombatState } from "./CombatTypes";

/* ---- Must match backend/app/schemas/game.py ---- */

export enum ActionType {
  NONE = 0,
  MOVE = 1,
  PICK_CARD = 2,
  DRAW_CARD = 3,
  PLAY_CARDS = 4,
  LEAVE = 5,
  DEBUG_START_COMBAT = 99, // TODO: remove when combats start from enemy collisions
}

// Python IntFlag + auto() -> 1, 2, 4, 8 (bit flags, so diagonals can be combined)
export enum Direction {
  NONE = 0,
  UP = 1 << 0,
  RIGHT = 1 << 1,
  DOWN = 1 << 2,
  LEFT = 1 << 3,
}

export interface Action {
  type: ActionType;
  direction: Direction;
  card: number;
  cards: string[];
}

export interface DisconnectInfo {
  code: number;
  reason: string;
}

export enum WsEvent {
  OPEN = "open",
  MESSAGE = "message",
  ERROR = "error",
  CLOSE = "close",
}

export enum GameWsEvent {
  OPEN = "open",
  DISCONNECTED = "disconnected",
  SNAPSHOT = "game.snapshot",
}

export enum GameWsMessageType {
  SNAPSHOT = "game.snapshot",
  PLAYER_ACTION = "game.player.action",
}

export enum ServerGameState {
  PAUSED = 1,
  RUNNING = 2,
  LEVEL_COMPLETE = 3,
  GAME_OVER = 4,
}

export interface SnapshotPlayer {
  player_id: number;
  x: number;
  y: number;
  sequence: number;
  state: number;
  hp: number;
  mp: number;
}

export interface SnapshotEnemy {
  enemy_id: number;
  x: number;
  y: number;
  fsm_state: number;
}

export interface GameSnapshot {
  type: GameWsMessageType.SNAPSHOT;
  game_id: string;
  ticks_per_second: number;
  tick_id: number;
  state: ServerGameState;
  dungeon_seed: number;
  user_player_id: number;
  players: SnapshotPlayer[];
  enemies: SnapshotEnemy[];
  combat: CombatState[];
  receivedAt: number;
}

export interface IGameSocket extends Phaser.Events.EventEmitter {
  readonly isOpen: boolean;
  sendAction(action: Action): number | null;
  close(): void;
}
