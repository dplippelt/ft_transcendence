import { Scene } from "phaser";
import type { INetworkScene } from "../network/INetworkScene";
import type { Action } from "../network/IGameSocket";

export default class MultiGameScene extends Scene implements INetworkScene {
  //   private _dungeon: Dungeon | null = null;
  //   private _currentSeed: number | null = null;
  //   private _localPlayer: PlayerMulti | null = null;
  //   private _playerId: number | null = null;
  //   private _remotePlayers = new Map<number, PlayerMulti>();
  //   private _enemies = new Map<number, EnemyMulti>();
  //   private _prevSnapshot: GameSnapshot | null = null;

  constructor() {
    super("MultiGameScene");
  }

  create() {
    // this.socket.on(GameWsEvent.SNAPSHOT, this.onSnapshot, this);
    // this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    //     this.socket.off(GameWsEvent.SNAPSHOT, this.onSnapshot, this);
    // });
  }

  nextAction(): Action | null {
    return null
  }

  onActionSent(action: Action, seq: number): void {
    void action;
    void seq;
  }
  //   private onSnapshot(snap: GameSnapshot) {
  //     this.myPlayerId = snap.user_player_id;

  //     // 1. Level / dungeon
  //     if (snap.dungeon_seed !== this.currentSeed) {
  //       this.rebuildDungeon(snap.dungeon_seed);   // MapBuilder with Mersenne Twister, same output as Python
  //       clear all entities;                        // re-spawned by syncEntities below
  //       this.currentSeed = snap.dungeon_seed;
  //     }

  //     // 2. Spawn/destroy by diffing ids (also covers the first snapshot, late joins and reconnects)
  //     syncEntities(snap.players, this.remotePlayers / this.localPlayer,
  //                  p => p.player_id === myPlayerId ? PlayerMulti.createLocal(...) : PlayerMulti.createRemote(...));
  //     syncEntities(snap.enemies, this.enemies, e => EnemyMulti.create(...));

  //     // 3. Feed the state into each entity
  //     for (p of snap.players) {
  //       if (p.player_id === myPlayerId) this.localPlayer.reconcile(p);         // rewind + replay
  //       else this.remotePlayers.get(p.player_id).pushSnapshot(snap.receivedAt, p);
  //       entity.setStatus(p.hp, p.mp, p.state);  // e.g. display only
  //     }
  //     for (e of snap.enemies)
  //       this.enemies.get(e.enemy_id).pushSnapshot(snap.receivedAt, e);

  //     // 4. Detect state changes -> fire events (no direct scene switching here)
  //     this.detectCombatStart(snap);
  //     this.detectSessionState(snap);

  //     this.prevSnapshot = snap;
  //   }

  //   private detectCombatStart(snap) {
  //     const mine     = snap.combat.find(c => c.player_id === myPlayerId);
  //     const hadMine  = prevSnapshot?.combat.some(c => c.player_id === myPlayerId);
  //     if (mine && !hadMine) {
  //       GameManagerScene.EventsCenter.emit(GameEvents.MultiCombatInitiated, {
  //         initialState: mine,          // CombatState
  //         enemyId: mine.enemy_id,
  //         sceneInvoker: this,
  //       } satisfies MultiCombatEventData);
  //     }
  //     // Combat end is NOT detected here (MultiCombatScene emits it after its final animations)

  //     // Optional: show a "fighting" marker on other players/enemies in combat
  //   }

  //   private detectSessionState(snap) {
  //     if (snap.state === prevSnapshot?.state) return;
  //     if (snap.state === ServerGameState.LEVEL_COMPLETE) EventsCenter.emit(GameEvents.LevelComplete);
  //     if (snap.state === ServerGameState.GAME_OVER)      EventsCenter.emit(GameEvents.GameOver, result);
  //   }

  //   // ============ Send + simulate (fixed tick) ============
  //   update(_time, delta) {
  //     this.accumulator += delta / 1000;
  //     let ticks = 0;
  //     while (accumulator >= FIXED_DT && ticks++ < MAX_TICKS_PER_FRAME) {
  //       this.fixedTick();
  //       accumulator -= FIXED_DT;
  //     }
  //     if (ticks >= MAX_TICKS_PER_FRAME) accumulator = 0;

  //     this.render();
  //   }

  //   private fixedTick() {
  //     if (!socket.isOpen) return;

  //     // In combat: movement is not allowed, but keep sending NONE as the heartbeat
  //     // (whether the combat scene's actions replace it is an open question with the backend)
  //     const inCombat = /* my player's state has IN_COMBAT */;
  //     const dir = inCombat ? Direction.NONE : toDirectionFlags(localPlayer.input.getInputDirection());

  //     const seq = socket.sendAction({ type: dir ? MOVE : NONE, direction: dir, card: 0 });
  //     localPlayer.predict(seq, dir, FIXED_DT, dungeon);   // pendingInputs.push + simulateMove
  //   }

  //   // ============ Rendering (every frame) ============
  //   private render() {
  //     localPlayer?.render(accumulator / FIXED_DT);        // lerp between prev and curr predicted position
  //     const t = performance.now() - INTERP_DELAY;
  //     for (e of [...remotePlayers.values(), ...enemies.values()])
  //       e.interpolate(t);                                  // between two buffered snapshots + pick the animation
  //   }
}
