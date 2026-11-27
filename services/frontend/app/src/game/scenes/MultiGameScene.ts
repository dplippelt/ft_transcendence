import Phaser, { Scene } from "phaser";
import type { INetworkScene } from "../network/INetworkScene";
import {
  ActionType,
  Direction,
  type Action,
  type GameSnapshot,
  type SnapshotEnemy,
  type SnapshotPlayer,
} from "../network/IGameSocket";
import { Dungeon } from "../gameobjects/dungeon/Dungeon";
import { GameType } from "../../utils/utils";
import { gRandom } from "../map/random";
import { dungeonConfig, tileSetMap } from "./GameScene";
import KeyboardComponent from "../components/KeyboardComponent";
import { playerConfigs, PlayerNum, type IPlayerConfig } from "../gameobjects/Player";
import { AssetsKey } from "../Assets";
import InterpolatedMovementComponent from "../components/InterpolatedMovementComponent";

function toWorld(state: SnapshotPlayer | SnapshotEnemy) {
  const position: { x: number; y: number } = {
    x: state.x,
    y: state.y,
  };
  return position;
}

function toDirectionFlag(vector: Phaser.Math.Vector2) {
  let flags = Direction.NONE;
  if (vector.y < 0) {
    flags |= Direction.UP;
  }
  if (vector.y > 0) {
    flags |= Direction.DOWN;
  }
  if (vector.x < 0) {
    flags |= Direction.LEFT;
  }
  if (vector.x > 0) {
    flags |= Direction.RIGHT;
  }
  return flags;
}

class PlayerMulti extends Phaser.GameObjects.Sprite {
  readonly id: number;
  readonly movement: InterpolatedMovementComponent;

  constructor(scene: Scene, state: SnapshotPlayer, config: IPlayerConfig) {
    const position = toWorld(state);
    super(scene, position.x, position.y, config.texture);
    this.id = state.player_id;
    this.name = `player_${state.player_id}`;
    this.movement = new InterpolatedMovementComponent(this);
    this.scene.add.existing(this);
  }
  applyState(state: SnapshotPlayer) {
    const { x, y } = toWorld(state);
    this.movement.setTarget(x, y);
  }
}

class EnemyMulti extends Phaser.GameObjects.Sprite {
  readonly id: number;
  readonly movement: InterpolatedMovementComponent;

  constructor(scene: Scene, state: SnapshotEnemy) {
    const position = toWorld(state);
    super(scene, position.x, position.y, AssetsKey.Skeleton);
    this.id = state.enemy_id;
    this.movement = new InterpolatedMovementComponent(this);
    this.scene.add.existing(this);
  }
  applyState(state: SnapshotEnemy) {
    const { x, y } = toWorld(state);
    this.movement.setTarget(x, y);
  }
}

export default class MultiGameScene extends Scene implements INetworkScene {
  private playerId!: number;
  private dungeon!: Dungeon;
  private dungeonSeed: number | null = null;
  private pendingAction: Action | null = null;
  private localPlayer: PlayerMulti | null = null;
  private localInput: KeyboardComponent | null = null;
  private readonly players = new Map<number, PlayerMulti>();
  private readonly enemies = new Map<number, EnemyMulti>();

  constructor() {
    super("MultiGameScene");
  }

  create(snapshot: GameSnapshot) {
    this.playerId = snapshot.user_player_id;
    this.dungeon = new Dungeon(this, GameType.OnlineCoop);
    this.dungeonSeed = null;
    this.pendingAction = null;
    this.localPlayer = null;
    this.localInput = null;
    this.players.clear();
    this.enemies.clear();
    this.applyState(snapshot);

    // FOR DEBUG
    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => {
      if (this.input.activePointer.leftButtonDown()) {
        this.requestDebugCombat();
      }
    });
  }

  nextAction(): Action | null {
    if (this.pendingAction) {
      const action = this.pendingAction;
      this.pendingAction = null;
      return action;
    }
    if (!this.localInput) {
      return null;
    }
    const direction = toDirectionFlag(this.localInput.getInputDirection());
    if (direction === Direction.NONE) {
      return null;
    }
    const move: Action = {
      type: ActionType.MOVE,
      direction: direction,
      card: 0,
      cards: [],
    };
    return move;
  }

  onActionSent(action: Action, seq: number): void {
    // TODO: client-side prediction of the movement (next PR)
    void action;
    void seq;
  }

  applyState(snapshot: GameSnapshot) {
    if (snapshot.dungeon_seed !== this.dungeonSeed) {
      this.buildDungeon(snapshot.dungeon_seed);
    }
    this.syncPlayers(snapshot.players);
    this.syncEnemies(snapshot.enemies);
  }

  private buildDungeon(seed: number) {
    // Same seed -> same map as the other players (and the server, once it builds the map)
    this.dungeonSeed = seed;
    gRandom.init_seed(seed);
    this.dungeon.build(dungeonConfig, tileSetMap, 1.5);
    // this.cameras.main.centerOn((this.dungeon.widthInPixels * 1.5) / 2, (this.dungeon.heightInPixels * 1.5) / 2);
  }

  private syncPlayers(players: SnapshotPlayer[]) {
    const inSnapshot = new Set(players.map((p) => p.player_id));

    const idToDelete = [...this.players.keys()].filter((id) => !inSnapshot.has(id));
    for (const id of idToDelete) {
      const player = this.players.get(id)!;
      if (player === this.localPlayer) {
        this.cameras.main.stopFollow();
        this.localPlayer = null;
        this.localInput = null;
      }
      player.destroy();
      this.players.delete(id);
    }

    for (const state of players) {
      let player = this.players.get(state.player_id);
      if (!player) {
        const isLocal = state.player_id === this.playerId;
        const playerConfig = playerConfigs[isLocal ? PlayerNum.One : PlayerNum.Two];
        player = new PlayerMulti(this, state, playerConfig);
        if (isLocal) {
          this.localPlayer = player;
          this.localInput = new KeyboardComponent(player, playerConfig.keySchema);
          this.cameras.main.startFollow(player);
        }
        this.players.set(state.player_id, player);
      }
      player.applyState(state);
    }
  }

  private syncEnemies(enemies: SnapshotEnemy[]) {
    const inSnapshot = new Set(enemies.map((e) => e.enemy_id));

    const idToDelete = [...this.enemies.keys()].filter((id) => !inSnapshot.has(id));
    for (const id of idToDelete) {
      const enemy = this.enemies.get(id)!;
      enemy.destroy();
      this.enemies.delete(id);
    }

    for (const state of enemies) {
      let enemy = this.enemies.get(state.enemy_id);
      if (!enemy) {
        enemy = new EnemyMulti(this, state);
        this.enemies.set(state.enemy_id, enemy);
      }
      enemy.applyState(state);
    }
  }

  private requestDebugCombat() {
    this.pendingAction = {
      type: ActionType.DEBUG_START_COMBAT, // use this field as debug
      direction: Direction.NONE,
      card: 0,
      cards: [],
    };
  }
}
