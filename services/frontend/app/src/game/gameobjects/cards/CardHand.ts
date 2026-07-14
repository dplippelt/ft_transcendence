import { Scene, Actions, GameObjects, Geom } from "phaser";
import CardBase, { CardEvents, Operator, type CardValue } from "./CardBase";

interface CardHandConfig {
  maxNumCards: number;
  firstCardCenterX: number;
  firstCardCenterY: number;
  handStartX: number;
  handStartY: number;
  handEndX: number;
  handEndY: number;
  focus: {
    diffX: number;
    diffY: number;
  };
}

export const cardHandConfig: CardHandConfig = {
  maxNumCards: 8, // limit for the hand cards to be implemented
  firstCardCenterX: 0,
  firstCardCenterY: 0,
  handStartX: 100,
  handStartY: 400,
  handEndX: 800,
  handEndY: 400,
  focus: {
    diffX: 0,
    diffY: 30,
  },
};

export default class CardHand {
  private readonly cardHandConfig!: CardHandConfig;
  private readonly cards!: GameObjects.Container;
  private readonly handLine!: Geom.Line;
  numCards: number;

  constructor(scene: Scene, config: CardHandConfig) {
    this.cardHandConfig = config;
    this.cards = scene.add.container(this.cardHandConfig.firstCardCenterX, this.cardHandConfig.firstCardCenterY);
    this.numCards = 0;

    this.handLine = new Geom.Line(
      this.cardHandConfig.handStartX,
      this.cardHandConfig.handStartY,
      this.cardHandConfig.handEndX,
      this.cardHandConfig.handEndY,
    );
  }

  addCard(card: CardBase) {
    // if (this.numCards >= this.cardHandConfig.maxNumCards) return;

    card.on(CardEvents.FOCUSON, this.focusOn, this);
    card.on(CardEvents.FOCUSOFF, this.focusOff, this);

    this.cards.add(card);
    this.numCards++;
  }

  clearHand() {
    const cards = this.cards.getAll() as CardBase[];
    for (const card of cards) {
      card.setVisible(false);
    }
    this.cards.removeAll(false);
    this.numCards = 0;
  }

  align() {
    Actions.PlaceOnLine(this.cards.getAll("isSelected", false), this.handLine);

    const focusedCard = this.cards.getFirst("isFocused", true) as CardBase;
    if (focusedCard?.input?.hitArea instanceof Geom.Rectangle) {
      const focus = this.cardHandConfig.focus;
      focusedCard.x -= focus.diffX;
      focusedCard.y -= focus.diffY;
    }
  }

  focusOn(card: CardBase) {
    if (card.getIsSelected()) return;

    card.setIsFocused(true);

    const focus = this.cardHandConfig.focus;
    if (card.input?.hitArea instanceof Geom.Rectangle) {
      card.input.hitArea.right += focus.diffX;
      card.input.hitArea.bottom += focus.diffY;
    }
  }

  focusOff(card: CardBase) {
    card.setIsFocused(false);

    const focus = this.cardHandConfig.focus;
    if (card.input?.hitArea instanceof Geom.Rectangle) {
      card.input.hitArea.right -= focus.diffX;
      card.input.hitArea.bottom -= focus.diffY;
    }
  }

  evaluateSelectedCards(selectedCards: CardBase[]) {
    if (!this.isValidSelection(selectedCards)) return null;

    const values = this.evaluateHighPrecedenceOperations(selectedCards);
    if (!values) return null;

    const result = this.evaluateLowPrecedenceOperations(values);
    return result;
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
    if (selectedCard.length % 2 === 0) return false;

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
