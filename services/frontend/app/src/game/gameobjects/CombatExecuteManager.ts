import CardBase, { type CardValue, Operator } from "./cards/CardBase";

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
}

export default class CombatExecuteManager {
  private result!: number | null;
  private combo!: ExecuteCombo | null;

  constructor() {
    this.reset();
  }

  reset() {
    this.result = null;
    this.combo = null;
  }

  getResult() {
    return this.result;
  }

  setCombo(value: ExecuteCombo) {
    this.combo = value;
  }

  getCombo() {
    return this.combo;
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
