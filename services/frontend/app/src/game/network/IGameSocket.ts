import Phaser from "phaser";
import type { ActionType, Direction } from "./GameSocket";
import { apiRequest } from "../../api/http";
import type { CombatState } from "./CombatTypes";

export interface Action {
  type: ActionType;
  direction: Direction;
  card: number;
  cards?: string[];
}

export interface IGameSocket extends Phaser.Events.EventEmitter {
  readonly isOpen: boolean;
  sendAction(action: Action): number | null;
  close(): void;
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
  type: "game.snapshot";
  game_id: string;
  tick_id: number;
  state: ServerGameState;
  dungeon_deed: number;
  user_player_id: number;
  players: SnapshotPlayer[];
  enemies: SnapshotEnemy[];
  combat: CombatState[];
  receivedAt: number;
}

// For test only
export class FakeGameSocket extends Phaser.Events.EventEmitter implements IGameSocket {
  private nextSequence = 1;
  private combatId: string | null = null;
  private open = false;

  constructor(private readonly userId: number) {
    super();
    void this.start();
  }

  get isOpen() {
    return this.open;
  }

  private async start() {
    const state = await apiRequest<CombatState>("/game/debug/combat", { method: "POST" });
    this.combatId = state.combat_id;
    void this.combatId; // TODO:
    this.open = true;
    this.emit("open");
    this.emitSnapshot(state);
  }

  sendAction(action: Action): number | null {
    if (!this.open) return null;
    const seq = this.nextSequence++;
    console.log("[FakeGameSocket] sendAction", seq, action);
    return seq;
  }

  close() {
    this.open = false;
    this.removeAllListeners();
  }

  private emitSnapshot(combat: CombatState, ackSequence = 0) {
    this.emit("game.snapshot", {
      type: "game.snapshot",
      game_id: "debug",
      tick_id: 0,
      state: 2,
      dungeon_seed: 0,
      user_player_id: this.userId,
      players: [{ player_id: this.userId, sequence: ackSequence }],
      enemies: [],
      combat: [combat],
      receiveAt: performance.now(),
    });
  }
}
