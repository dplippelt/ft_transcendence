import type { CardValue } from "./CardBase";
import CardBase, { OPERATORS } from "./CardBase";
import { Scene } from "phaser";

interface CardDeckConfig {
  amount: number;
  numberRange: {
    min: number;
    max: number;
  };
  weight: {
    numbers: number;
    operators: number;
  };
  uniformity: number;
  reductionFactor: number;
}

export const cardDeckConfig: CardDeckConfig = {
  amount: 20,
  numberRange: {
    min: 1,
    max: 30,
  },
  weight: {
    numbers: 70,
    operators: 30,
  },
  uniformity: 3,
  reductionFactor: 0.3,
};

interface CardWeight {
  value: CardValue;
  weight: number;
}

interface WeightReduction {
  number: number;
  operator: number;
}

export default class CardDeck {
  readonly scene: Scene;
  readonly config: CardDeckConfig;
  readonly baseWeights: CardWeight[];
  readonly weightReduction: WeightReduction;
  private deck!: CardBase[];
  private cover: CardBase;

  constructor(scene: Scene, config: CardDeckConfig) {
    this.scene = scene;
    this.config = config;
    this.baseWeights = this.initBaseWeights(this.config);
    this.weightReduction = this.setWeightReductionFromConfig(this.config);
    this.initDeck();
    this.cover = new CardBase(scene);
    this.scene.add.existing(this.cover);
    this.cover.setDepth(1); // hard cord
  }

  initBaseWeights(config: CardDeckConfig) {
    const baseWeights: CardWeight[] = [];
    const minNum = config.numberRange.min;
    const maxNum = config.numberRange.max;
    const numberWeight = config.weight.numbers / (maxNum - minNum + 1);
    const operatorWeight = config.weight.operators / OPERATORS.length;

    for (let i = minNum; i <= maxNum; ++i) {
      baseWeights.push({ value: i, weight: numberWeight });
    }
    for (const operator of OPERATORS) {
      baseWeights.push({ value: operator, weight: operatorWeight });
    }
    return baseWeights;
  }

  setWeightReductionFromConfig(config: CardDeckConfig) {
    const minNum = config.numberRange.min;
    const maxNum = config.numberRange.max;
    const numberWeight = config.weight.numbers / (maxNum - minNum + 1);
    const operatorWeight = config.weight.operators / OPERATORS.length;
    const factor = config.reductionFactor;

    return { number: numberWeight * factor, operator: operatorWeight * factor } as WeightReduction;
  }

  initDeck() {
    const amount = this.config.amount;
    const baseWeights = this.baseWeights;
    const weightReduction = this.weightReduction;

    if (amount < 0) throw Error("Amount for generating cards should be positive");

    const cards: CardBase[] = [];
    const weights = structuredClone(baseWeights);

    for (let i = 0; i < amount; ++i) {
      const card = this.generateCard(weights);
      this.adjustWeights(weights, card, weightReduction);
      cards.push(card);
    }

    shuffle(cards);

    this.deck = cards;
    if (!this.deck.length) {
      throw Error("Could not create a new deck");
    }
  }

  generateCard(cardWeights: readonly CardWeight[]) {
    if (!cardWeights.length) {
      throw Error("Card weights is not configured");
    }

    const normalizedWeights = this.softmax(cardWeights);

    const cardWeight = weightedRandom(normalizedWeights);

    const card = new CardBase(this.scene, cardWeight.value);

    this.scene.add.existing(card);

    return card;
  }

  adjustWeights(cardWeights: CardWeight[], target: CardBase, reduction: WeightReduction) {
    const targetValue = target.getValue();

    for (const card of cardWeights) {
      if (card.value !== targetValue) continue;
      if (target.isValueNumber()) card.weight -= reduction.number;
      else if (target.isValueOperator()) card.weight -= reduction.operator;
      else throw Error("Unexpected CardValue");
      break;
    }
  }

  softmax(cardWeights: readonly CardWeight[]) {
    const normalizedWeights: CardWeight[] = [];
    let sum = 0;
    for (const cardWeight of cardWeights) {
      const value = cardWeight.value;
      const expWeight = Math.exp(cardWeight.weight / this.config.uniformity);
      normalizedWeights.push({ value: value, weight: expWeight });
      sum += expWeight;
    }
    if (sum) normalizedWeights.forEach((card) => (card.weight /= sum));
    return normalizedWeights;
  }

  dealCard() {
    return this.deck.pop();
  }

  getDeck() {
    return this.deck;
  }

  getCover() {
    return this.cover;
  }

  isEmpty() {
    return !this.deck.length;
  }
}

// temporarily copied from services/frontend/app/src/game/map/math.ts
/// source: https://blog.bruce-hill.com/a-faster-weighted-random-choice
export function weightedRandom(weights: CardWeight[]) {
  let remaining: number = Math.random() * weights.reduce((sum: number, curr: CardWeight) => sum + curr.weight, 0);

  for (const element of weights) {
    remaining -= element.weight;
    if (remaining < 0) {
      return element;
    }
  }
  throw new Error("Unreachable code reached");
}

// min inclusive and max exclusive => [min, max)
export function random(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

export function shuffle(arr: Array<any>): void {
  for (let i = arr.length - 1; i > 0; --i) {
    const pick = random(0, i + 1);
    [arr[pick], arr[i]] = [arr[i], arr[pick]];
  }
}
