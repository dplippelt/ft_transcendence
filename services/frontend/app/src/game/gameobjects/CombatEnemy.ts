import Phaser, { Scene } from "phaser";
import { AssetsKey } from "../Assets";

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

export default class CombatEnemy extends Phaser.GameObjects.Sprite {
  readonly enemyData: EnemyData;
  hitPoint: number;

  constructor(scene: Scene, enemyData: EnemyData) {
    super(scene, 0, 0, AssetsKey.CombatEnemy);
    this.enemyData = enemyData;
    this.hitPoint = enemyData.hitPoint;
    this.scene.add.existing(this);
    this.setFlipX(true);
  }

  takeDamage(damage: number) {
    this.hitPoint -= damage;
  }

  isDead() {
    return this.hitPoint <= 0;
  }
}
