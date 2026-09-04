import CardBase, { type CardValue, Operator } from "./cards/CardBase";
import { shuffle } from "./cards/CardDeck";

export enum ExecuteCombo {
  ONE,
  TWO,
  THREE,
}

export type DamageToEnemy = Record<ExecuteCombo, number>;

export const damageToEnemyConfig: DamageToEnemy = {
  [ExecuteCombo.ONE]: 2,
  [ExecuteCombo.TWO]: 4,
  [ExecuteCombo.THREE]: 8,
};

export default class CombatExecuteManager {
  private result!: number | null;
  private combo!: ExecuteCombo | null;
  private targetNumbers!: Record<ExecuteCombo, number | null>;

  constructor() {
    this.reset();
  }

  reset() {
    this.result = null;
    this.combo = null;
    this.targetNumbers = {
      [ExecuteCombo.ONE]: null,
      [ExecuteCombo.TWO]: null,
      [ExecuteCombo.THREE]: null,
    };
  }

  getResult() {
    return this.result;
  }

  getCombo() {
    return this.combo;
  }

  generateTargetNumbersFromHand(cards: CardBase[]) {
    const numbers: CardBase[] = [];
    const operators: CardBase[] = [];

    for (const card of cards) {
      if (card.isValueNumber()) {
        numbers.push(card);
      } else {
        operators.push(card);
      }
    }
    this.targetNumbers[ExecuteCombo.ONE] = this.generateTargetNumber(numbers, operators, 1);
    this.targetNumbers[ExecuteCombo.TWO] = this.generateTargetNumber(numbers, operators, 2);
    this.targetNumbers[ExecuteCombo.THREE] = this.generateTargetNumber(numbers, operators, 3);
  }

  // FOR DEBUG
  consoleTargetNumbers() {
    console.log("target number for 1 combo = " + this.targetNumbers[ExecuteCombo.ONE]);
    console.log("target number for 2 combo = " + this.targetNumbers[ExecuteCombo.TWO]);
    console.log("target number for 3 combo = " + this.targetNumbers[ExecuteCombo.THREE]);
  }

  generateTargetNumber(numbers: CardBase[], operators: CardBase[], numOperators: number): number | null {
    if (numbers.length < numOperators + 1 || operators.length < numOperators) {
      return null;
    }
    shuffle(numbers);
    shuffle(operators);
    const cards: CardBase[] = [];
    for (let i = 0; i < numOperators; ++i) {
      cards.push(numbers[i]);
      cards.push(operators[i]);
    }
    cards.push(numbers[numOperators]);

    const values = this.evaluateHighPrecedenceOperations(cards);
    if (!values) {
      return this.generateTargetNumber(numbers, operators, numOperators);
    }
    const result = this.evaluateLowPrecedenceOperations(values);
    return result;
  }

  evaluateSelectedCards(selectedCards: CardBase[]) {
    if (!this.isValidSelection(selectedCards)) {
      this.result = null;
      return;
    }

    const values = this.evaluateHighPrecedenceOperations(selectedCards);
    if (!values) {
      this.result = null;
      return;
    }
    this.result = this.evaluateLowPrecedenceOperations(values);

    const numOperators = (selectedCards.length - 1) / 2;
    switch (numOperators) {
      case 1:
        this.combo = ExecuteCombo.ONE;
        break;
      case 2:
        this.combo = ExecuteCombo.TWO;
        break;
      case 3:
        this.combo = ExecuteCombo.THREE;
        break;
      default:
        this.combo = null;
        break;
    }
  }

  isSuccessHitTarget() {
    if (this.combo === null || this.result === null) {
        return false;
    }
    if (this.targetNumbers[this.combo] === this.result) {
        return true;
    }
    return false;
  }

  evaluateHighPrecedenceOperations(selectedCards: CardBase[]) {
    const values: CardValue[] = [];

    for (let i = 0; i < selectedCards.length; ++i) {
      const card = selectedCards[i];

      if (i % 2 === 0) {
        const currNum = card.getValue() as number;

        if (!values.length) {
          values.push(currNum);
          continue;
        }

        const operator = values.pop() as Operator;
        const preNum = values.pop() as number;

        switch (operator) {
          case Operator.Multiply:
            values.push(preNum * currNum);
            break;

          case Operator.Divide:
            if (currNum === 0) return null;
            values.push(preNum / currNum);
            break;

          case Operator.Modulo:
            if (currNum === 0) return null;
            values.push(preNum % currNum);
            break;

          default:
            values.push(preNum);
            values.push(operator);
            values.push(currNum);
            break;
        }
      } else {
        const operator = card.getValue() as Operator;
        values.push(operator);
      }
    }

    return values;
  }

  evaluateLowPrecedenceOperations(values: CardValue[]) {
    let num = values[0] as number;

    for (let i = 2; i < values.length; i += 2) {
      const currNum = values[i] as number;
      const operator = values[i - 1] as Operator;

      switch (operator) {
        case Operator.Plus:
          num += currNum;
          break;

        case Operator.Minus:
          num -= currNum;
          break;

        default:
          break;
      }
    }

    return num;
  }

  isValidSelection(selectedCard: CardBase[]) {
    if (selectedCard.length === 1 || selectedCard.length % 2 === 0) {
      return false;
    }

    for (let i = 0; i < selectedCard.length; ++i) {
      const card = selectedCard[i];

      if (i % 2 === 0) {
        if (!card.isValueNumber()) return false;
      } else {
        if (!card.isValueOperator()) return false;
      }
    }
    return true;
  }
}
