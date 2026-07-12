import type { CardValue } from "./CardBase";
import CardBase, { OPERATORS } from "./CardBase";
import type { Scene } from "phaser";

interface CardDeckConfig {
  weight: {
    numbers: number;
    operators: number;
  };
  numberRange: {
    min: number;
    max: number;
  };
  temperature: number;
}

export const cardDeckConfig: CardDeckConfig = {
  weight: {
    numbers: 70,
    operators: 30,
  },
  numberRange: {
    min: 1,
    max: 30,
  },
  temperature: 4,
};

interface CardWeight {
  value: CardValue;
  weight: number;
}

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

export default class CardDeck {
  readonly config!: CardDeckConfig;
  readonly baseWeights: CardWeight[];
  readonly generatedStatus = new Map<CardValue, number>();
  readonly deck!: CardBase[];
  readonly scene!: Scene;

  constructor(scene: Scene, config: CardDeckConfig) {
    this.config = config;
    this.baseWeights = this.initBaseWeights(config);
    for (const baseWeight of this.baseWeights) {
      console.log("value " + baseWeight.value + " weight = " + baseWeight.weight);
    }
    for (const card of this.baseWeights) {
      this.generatedStatus.set(card.value, 0);
    }
    this.scene = scene;
    this.deck = [];
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

  generateCard(cardWeights: readonly CardWeight[]) {
    if (!cardWeights.length) {
      throw Error("Card weights is not configured");
    }

    const normalizedWeights = this.softmax(cardWeights);
    for (const weight of normalizedWeights) {
      console.log("value " + weight.value + " weight = " + weight.weight);
    }

    const cardWeight = weightedRandom(normalizedWeights);
    console.log("selected card " + cardWeight.value + " weight " + cardWeight.weight);

    return new CardBase(this.scene, cardWeight.value);
  }

  addCardToDeck(card: CardBase) {
    this.deck.push(card);
    const cardValue = card.getValue()!;
    let count = this.generatedStatus.get(cardValue) || 0;
    this.generatedStatus.set(cardValue, count + 1);
    for (const card of this.deck) {
      console.log(card.getValue());
    }
  }

  softmax(cardWeights: readonly CardWeight[]) {
    const normalizedWeights: CardWeight[] = [];
    let sum = 0;
    for (const cardWeight of cardWeights) {
      const value = cardWeight.value;
      const expWeight = Math.exp(cardWeight.weight / this.config.temperature);
      normalizedWeights.push({ value: value, weight: expWeight });
      sum += expWeight;
    }
    if (sum) normalizedWeights.forEach((value) => (value.weight /= sum));
    return normalizedWeights;
  }
}
