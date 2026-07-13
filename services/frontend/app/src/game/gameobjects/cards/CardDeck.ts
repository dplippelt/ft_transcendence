import type { CardValue } from "./CardBase";
import CardBase, { OPERATORS } from "./CardBase";
import type { Scene } from "phaser";

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
  amount: 10,
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
  readonly scene!: Scene;
  readonly config!: CardDeckConfig;
  readonly baseWeights: CardWeight[];
  readonly weightReduction: WeightReduction;
  //   readonly generateStatus = new Map<CardValue, number>();
  deck!: CardBase[];
  numDealedCards: number = 0;

  constructor(scene: Scene) {
    this.scene = scene;
    this.config = cardDeckConfig;
    this.baseWeights = this.initBaseWeights(this.config);
    this.weightReduction = this.setWeightReductionFromConfig(this.config);
    this.deck = this.generateCards(this.config.amount, this.baseWeights, this.weightReduction);

    // for (const card of this.baseWeights) {
    //   this.generateStatus.set(card.value, 0);
    // }
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

    console.log("reduction weight number " + numberWeight * factor + " operator " + operatorWeight * factor);
    return { number: numberWeight * factor, operator: operatorWeight * factor } as WeightReduction;
  }

  generateCards(amount: number, baseWeights: CardWeight[], weightReduction: WeightReduction) {
    if (amount < 0) throw Error("Amount for generating cards should be positive");

    const cards: CardBase[] = [];
    const weights = baseWeights.map((value) => value);

    for (let i = 0; i < amount; ++i) {
      const card = this.generateCard(weights);
      this.adjustWeights(weights, card, weightReduction);
      cards.push(card);
    }

    shuffle(cards);

    return cards;
  }

  generateCard(cardWeights: readonly CardWeight[]) {
    if (!cardWeights.length) {
      throw Error("Card weights is not configured");
    }
    console.log("card weight before softmax ");
    for (const weight of cardWeights) {
      console.log("value " + weight.value + " weight = " + weight.weight);
    }

    const normalizedWeights = this.softmax(cardWeights);
    console.log("card weight after softmax ");
    for (const weight of normalizedWeights) {
      console.log("value " + weight.value + " weight = " + weight.weight);
    }

    const cardWeight = weightedRandom(normalizedWeights);
    console.log("selected card " + cardWeight.value + " weight " + cardWeight.weight);

    return new CardBase(this.scene, cardWeight.value);
  }

  adjustWeights(cards: CardWeight[], target: CardBase, reduction: WeightReduction) {
    const targetValue = target.getValue();

    for (const card of cards) {
      if (card.value !== targetValue) continue;
      if (target.isValueNumber()) card.weight -= reduction.number;
      else if (target.isValueOperator()) card.weight -= reduction.operator;
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
    if (sum) normalizedWeights.forEach((value) => (value.weight /= sum));
    return normalizedWeights;
  }

  dealCard() {
    const index = this.numDealedCards;

    if (index >= this.deck.length) {
      const newDeck = this.generateCards(this.config.amount, this.baseWeights, this.weightReduction);
      if (!newDeck.length) throw Error("Could not create a new deck");

      this.deck = this.deck.concat(newDeck);
    }

    this.numDealedCards++;
    return this.deck[index];
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

//   updateGenerateStatus(cardValue: CardValue) {
//     let count = this.generateStatus.get(cardValue) || 0;
//     this.generateStatus.set(cardValue, count + 1);
//     for (const card of this.deck) {
//       console.log(card.getValue());
//     }
//   }

//   addCardToDeck(card: CardBase) {
//     this.deck.push(card);
//     const cardValue = card.getValue()!;
//     let count = this.generateStatus.get(cardValue) || 0;
//     this.generateStatus.set(cardValue, count + 1);
//     for (const card of this.deck) {
//       console.log(card.getValue());
//     }
//   }
