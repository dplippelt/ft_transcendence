import Phaser, { Scene } from "phaser";
import GameScene from "./GameScene";
import CombatScene from "./CombatScene";
import type { ICombatEventData } from "../events/ICombatEventData";
import { EnemyEvent } from "../gameobjects/Enemy";

export const eventsCenter = new Phaser.Events.EventEmitter();

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
  private _gameScene!: GameScene;
  private _combatScenes: CombatScene[];
  private _gameType: GameType;

  constructor() {
    super("game-manager");

    this._gameType = GameType.SinglePlayer;
    this._combatScenes = [];
  }

  init() {
    eventsCenter.on(GameEvents.CombatInitiated, this.onCombatInitiated, this);
    eventsCenter.on(GameEvents.CombatOver, this.onCombatOver, this);

    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      eventsCenter.off(GameEvents.CombatInitiated, this.onCombatInitiated, this);
      eventsCenter.off(GameEvents.CombatOver, this.onCombatOver, this);
    });

    this._gameScene = new GameScene();
    this.scene.add("GameScene", this._gameScene, true);
  }

  private onCombatInitiated(combatEventData: ICombatEventData) {
    let combatScene = this._combatScenes.find((scene) => this.scene.isActive(scene));
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

  private onCombatOver(combatEventData: ICombatEventData) {
    // TODO: player specific event, Win/Lose, progession
    combatEventData.enemy.emit(EnemyEvent.CombatOver, combatEventData.isPlayerDefeated);

    this.scene.moveDown(combatEventData.sceneInvoker);
    this.scene.stop(combatEventData.sceneInvoker);
    if (this._gameType === GameType.SinglePlayer) {
      this.scene.wake(this._gameScene);
    }
  }
}
