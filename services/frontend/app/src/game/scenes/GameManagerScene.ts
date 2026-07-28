import Phaser, { Scene } from "phaser";
import GameScene from "./GameScene";
import CombatScene from "./CombatScene";
import type { CombatEventData } from "../events/CombatEventData";

export enum GameEvents {
  CombatInitiated = "combat-initiated",
  CombatOver = "combat-over",
  PlayerDefeated = "player-defeated",
  EnemyDefeated = "enemy-defeated",
  LevelComplete = "level-complete",
  GameOver = "game-over",
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

  constructor() {
    super("game-manager");

    this._gameType = GameType.SinglePlayer;
    this._combatScenes = [];
  }

  init() {
    GameManagerScene.EventsCenter.on(GameEvents.CombatInitiated, this.onCombatInitiated, this);
    GameManagerScene.EventsCenter.on(GameEvents.CombatOver, this.onCombatOver, this);

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
      combatEventData.player.destroy();
    }

    this.scene.moveDown(combatEventData.sceneInvoker);
    this.scene.stop(combatEventData.sceneInvoker);
    if (this._gameType === GameType.SinglePlayer) {
      this.scene.wake(this._gameScene);
    }
  }
}
