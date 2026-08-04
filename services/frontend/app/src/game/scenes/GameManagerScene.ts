import Phaser, { Scene } from "phaser";
import GameScene from "./GameScene";
import CombatScene from "./CombatScene";
import Player from "../gameobjects/Player";
import type { CombatEventData } from "../events/CombatEventData";

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

  private _gameScene!: GameScene;
  private _combatScenes: CombatScene[];
  private _gameType: GameType;
  private _exitedPlayers: Set<Player>;
  private _levelCount: number = 5; // TODO: Hard-coded for now

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
    });

    this._gameScene = new GameScene();
    this.scene.add("GameScene", this._gameScene, true);
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
    this.scene.moveUp(combatScene);
    if (this._gameType === GameType.SinglePlayer) {
      this.scene.sleep(this._gameScene);
    }
  }

  private onCombatOver(combatEventData: CombatEventData) {
    // TODO: player specific event, Win/Lose, progession
    if (!combatEventData.player.isAlive) {
      combatEventData.player.disableBody(true, true);
      if (!this.anyPlayerAlive()) {
        this.onGameOver();
        return;
      }
    }

    this.scene.moveDown(combatEventData.sceneInvoker);
    this.scene.stop(combatEventData.sceneInvoker);
    if (this._gameType === GameType.SinglePlayer) {
      this.scene.wake(this._gameScene);
    }

    if (this.allEnemiesDefeated()) {
      GameManagerScene.EventsCenter.emit(GameEvents.LevelComplete);
    }
  }

  private onGameOver(): void {
    // TODO: Go back to main menu
    console.error("Game Over!!!");
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
        this.onGameOver();
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
