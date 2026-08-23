import type { Scene } from "phaser";
import BoxedText from "./utils/BoxedText";
import { cardConfig } from "./utils/cardConfig";
import type { PlayerStatus } from "../scenes/CombatScene";
import { EventBus } from "../EventBus";
import { CombatEvent } from "../../utils/utils";

export enum EnemyLevel {
  EASY,
  NORMAL,
  HARD,
}

export interface EnemyData {
  hitPoint: number;
  attackDamage: number;
}

export type EnemyTypes = Record<EnemyLevel, EnemyData>;

export const enemyTypes: EnemyTypes = {
  [EnemyLevel.EASY]: {
    hitPoint: 100,
    attackDamage: 10,
  },
  [EnemyLevel.NORMAL]: {
    hitPoint: 200,
    attackDamage: 30,
  },
  [EnemyLevel.HARD]: {
    hitPoint: 300,
    attackDamage: 50,
  },
};

export default class CombatEnemy extends BoxedText {
  readonly enemyData: EnemyData;
  hitPoint: number;

  constructor(scene: Scene, enemyData: EnemyData) {
    super(scene, "enemy", cardConfig.cardContentConfig, cardConfig.cardStyleConfig);
    this.enemyData = enemyData;
    this.hitPoint = enemyData.hitPoint;
  }

  takeDamage(damage: number) {
    this.hitPoint -= damage;
    EventBus.emit(CombatEvent.updateEnemyHP, this.hitPoint);
  }

  attack(playerStatus: PlayerStatus) {
    playerStatus.hitPoint -= this.enemyData.attackDamage;
    EventBus.emit(CombatEvent.updatePlayerHP, playerStatus.hitPoint);
  }
}
