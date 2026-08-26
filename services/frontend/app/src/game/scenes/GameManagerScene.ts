import Phaser, { Core, Scene } from "phaser";
import GameScene from "./GameScene";
import CombatScene from "./CombatScene";
import Player from "../gameobjects/Player";
import type { CombatEventData } from "../events/CombatEventData";
import { EventBus } from "../EventBus";
import { CombatEvent, GameEvent, GameState } from "../../utils/utils";

export enum GameEvents {
  CombatInitiated = "combat-initiated",
  CombatOver = "combat-over",
  PlayerDefeated = "player-defeated",
  EnemyDefeated = "enemy-defeated",
  LevelComplete = "level-complete",
  LevelExit = "level-exit",
  GameOver = "game-over",
}

export interface LevelExitEventData {
  player: Player;
}

enum GameType {
  SinglePlayer,
  LocalCoop,
  OnlineCoop,
}

export class GameManagerScene extends Scene {
  static readonly EventsCenter = new Phaser.Events.EventEmitter();

  private _isGameVisible = true;
  private _isChatFocused = false;
  private _gameScene!: GameScene;
  private _combatScenes: CombatScene[];
  private _gameType: GameType;
  private _pendingCombatScene: Phaser.Scene | null = null;
  private _exitedPlayers: Set<Player>;
  private _levelCount: number = 1; // TODO: Hard-coded for now
                                    // // TODO: change back to intended max level count (was 5)

  constructor() {
    super("game-manager");

    this._gameType = GameType.SinglePlayer;
    this._combatScenes = [];
    this._exitedPlayers = new Set<Player>();
  }

  init() {
    GameManagerScene.EventsCenter.on(GameEvents.CombatInitiated, this.onCombatInitiated, this);
    GameManagerScene.EventsCenter.on(GameEvents.CombatOver, this.onCombatOver, this);
    GameManagerScene.EventsCenter.on(GameEvents.LevelExit, this.onExitLevel, this);

    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      GameManagerScene.EventsCenter.off(GameEvents.CombatInitiated, this.onCombatInitiated, this);
      GameManagerScene.EventsCenter.off(GameEvents.CombatOver, this.onCombatOver, this);
      GameManagerScene.EventsCenter.off(GameEvents.LevelExit, this.onExitLevel, this);
    });

    this._gameScene = new GameScene();
    this.scene.add("GameScene", this._gameScene, true);
  }

  create() {
    this.input.keyboard?.on("keydown-ESC", () => EventBus.emit(GameEvent.gameMenu));

    EventBus.on(GameEvent.gameVis, (visible: boolean) => {
      this._isGameVisible = visible;
      this.updateGlobalCapture();
    });

    EventBus.on(GameEvent.chatFocus, (focused: boolean) => {
      this._isChatFocused = focused;
      this.updateGlobalCapture();
      if ( focused )
        this.game.events.emit(Core.Events.BLUR);
    });

    EventBus.on(GameEvent.gameMenu, () => {
      if (this._gameType === GameType.OnlineCoop)
        return; // Do not pause game for online multiplayer games when game menu is opened.

      this.togglePause();
    });
  }

  /* Update global capture for the (re-)launched combat scene.
   * Namely this should prevent capture from re-enabling if
   * the chat window happened to be open during combat initiation.
   * Note: _pendingCombatScene is set inside onCombatInitiated() */
  update() {
    if ( this._pendingCombatScene && this.scene.isActive(this._pendingCombatScene) ) {
      this.updateGlobalCapture();
      this._pendingCombatScene = null;
    }
  }

  private onCombatInitiated(combatEventData: CombatEventData) {
    let combatScene = this._combatScenes.find((scene) => !this.scene.isActive(scene));
    if (combatScene !== undefined) {
      this.scene.launch(combatScene, combatEventData);
    } else {
      const scenekey = `CombatScene_${this._combatScenes.length}`;
      combatScene = new CombatScene(scenekey);
      this.scene.add(scenekey, combatScene, true, combatEventData);
      this._combatScenes.push(combatScene);
    }

    this._pendingCombatScene = combatScene;

    this.scene.moveUp(combatScene);
    if (this._gameType === GameType.SinglePlayer) {
      this.scene.sleep(this._gameScene);
    }

    EventBus.emit(GameEvent.inCombat, true);
  }

  private onCombatOver(combatEventData: CombatEventData) {
    if (!combatEventData.player.isAlive) {
      combatEventData.player.disableBody(true, true);
      if (!this.anyPlayerAlive()) {
        this.onGameOver(GameState.lost);
        return;
      }
    }

    if (this.allEnemiesDefeated()) {
      GameManagerScene.EventsCenter.emit(GameEvents.LevelComplete);
    }

    this.scene.moveDown(combatEventData.sceneInvoker);
    this.scene.stop(combatEventData.sceneInvoker);
    if (this._gameType === GameType.SinglePlayer) {
      this.scene.wake(this._gameScene);
    }

    /* Update global capture for game scene
     * No need for an event as the game scene is never stopped */
    this.updateGlobalCapture();

    EventBus.emit(GameEvent.inCombat, false);
    EventBus.removeListener(CombatEvent.attack);
    EventBus.removeListener(CombatEvent.draw);
    EventBus.removeListener(CombatEvent.reset);
  }

  private updateGlobalCapture() {
    const shouldCapture = this._isGameVisible && !this._isChatFocused;

    for ( const scene of this.getActiveScenes() )
    {
      if ( scene.input.keyboard )
        scene.input.keyboard.enabled = shouldCapture;

      if ( shouldCapture )
        scene.input.keyboard?.enableGlobalCapture();
      else
        scene.input.keyboard?.disableGlobalCapture();
    }
  }

  private togglePause() {
    for ( const scene of this.getActiveScenes() ) {
      if (this.scene.isPaused(scene)) {
        this.scene.resume(scene);
        EventBus.emit(CombatEvent.pauseTimer, false);
      }
      else {
        this.scene.pause(scene);
        EventBus.emit(CombatEvent.pauseTimer, true);
      }
    }
  }

  private getActiveScenes() : Phaser.Scene[] {
    return [this._gameScene, ...this._combatScenes]
      .filter((scene) => this.scene.isActive(scene) || this.scene.isPaused(scene));
  }

  private onGameOver( state: GameState ): void {
    EventBus.emit(GameEvent.gameState, state);
  }

  private onExitLevel(player: Player): void {
    if (!this.anyPlayerAlive() || !this.allEnemiesDefeated()) {
      return;
    }
    this._exitedPlayers.add(player);
    player.disableBody(true, true);

    if (this.allPlayersExited()) {
      this._exitedPlayers.clear();
      if (--this._levelCount) {
        this._gameScene.nextLevel();
      } else {
        this.onGameOver(GameState.won);
      }
    }
  }

  private allPlayersExited(): boolean {
    return this._exitedPlayers.size === this._gameScene.getAlivePlayerCount();
  }

  private allEnemiesDefeated(): boolean {
    return this._gameScene.getEnemyCount() === 0;
  }

  private anyPlayerAlive() {
    return this._gameScene.getAlivePlayerCount() > 0;
  }
}
