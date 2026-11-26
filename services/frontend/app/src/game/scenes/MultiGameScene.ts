import Phaser, { Scene } from "phaser";
import type { INetworkScene } from "../network/INetworkScene";
import { ActionType, Direction, type Action, type GameSnapshot } from "../network/IGameSocket";
import { Dungeon } from "../gameobjects/dungeon/Dungeon";
import { GameType } from "../../utils/utils";
import { gRandom } from "../map/random";
import { dungeonConfig, tileSetMap } from "./GameScene";

export default class MultiGameScene extends Scene implements INetworkScene {
  private dungeon!: Dungeon;
  private dungeonSeed: number | null = null;
  private pendingAction: Action | null = null;

  constructor() {
    super("MultiGameScene");
  }

  create(snapshot: GameSnapshot) {
    this.dungeonSeed = null;
    this.pendingAction = null;
    this.dungeon = new Dungeon(this, GameType.OnlineCoop);
    this.applyState(snapshot);

    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => {
      if (this.input.activePointer.leftButtonDown()) {
        this.requestDebugCombat();
      }
    });
  }

  nextAction(): Action | null {
    const action = this.pendingAction;
    this.pendingAction = null;
    return action;
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
    // TODO: players / enemies from the snapshot (next PR)
    // syncEntities(): players, enemies
  }

  private buildDungeon(seed: number) {
    // Same seed -> same map as the other players (and the server, once it builds the map)
    this.dungeonSeed = seed;
    gRandom.init_seed(seed);
    this.dungeon.build(dungeonConfig, tileSetMap, 1.5);
    // No player follow yet: look at the middle of the map
    this.cameras.main.centerOn((this.dungeon.widthInPixels * 1.5) / 2, (this.dungeon.heightInPixels * 1.5) / 2);
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
