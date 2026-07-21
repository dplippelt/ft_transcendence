import type { Scene } from "phaser";
import BoxedText from "./utils/BoxedText";
import { cardConfig } from "./utils/cardConfig";
import type { PlayerStatus } from "../scenes/CombatScene";

export enum EnemyLevel {
  EASY,
  NORMAL,
  HARD,
}

export interface EnemyData {
  hitPoint: number;
  attackDamage: number;
  battleRound: number;
}

export type EnemyTypes = Record<EnemyLevel, EnemyData>;

export const enemyTypes: EnemyTypes = {
  [EnemyLevel.EASY]: {
    hitPoint: 100,
    attackDamage: 10,
    battleRound: 3,
  },
  [EnemyLevel.NORMAL]: {
    hitPoint: 200,
    attackDamage: 30,
    battleRound: 2,
  },
  [EnemyLevel.HARD]: {
    hitPoint: 300,
    attackDamage: 50,
    battleRound: 1,
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
  }

  attack(playerStatus: PlayerStatus) {
    playerStatus.hitPoint -= this.enemyData.attackDamage;
  }
}
