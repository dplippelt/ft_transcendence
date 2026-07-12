import { Scenes, Scene, Actions, GameObjects, Geom } from "phaser";
import CardBase, { CardEvents, Operator, type CardValue } from "./CardBase";
import CardSelection from "./CardSelection";
import CardDeck, { cardDeckConfig } from "./CardDeck";

interface CardHandConfig {
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

const cardHandConfig: CardHandConfig = {
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
  private readonly cardSelection!: CardSelection;
  private readonly cardDeck!: CardDeck;

  constructor(scene: Scene) {
    this.cardHandConfig = cardHandConfig;

    this.cardSelection = new CardSelection(scene, 7);

    this.cards = scene.add.container(this.cardHandConfig.firstCardCenterX, this.cardHandConfig.firstCardCenterY);

    this.cards.addToUpdateList();
    scene.events.on(Scenes.Events.UPDATE, this.update, this);
    this.cards.once(
      GameObjects.Events.DESTROY,
      () => {
        scene.events.off(Scenes.Events.UPDATE, this.update, this);
      },
      this,
    );

    scene.input.setTopOnly(true);

    this.handLine = new Geom.Line(
      this.cardHandConfig.handStartX,
      this.cardHandConfig.handStartY,
      this.cardHandConfig.handEndX,
      this.cardHandConfig.handEndY,
    );

    this.cardDeck = new CardDeck(scene, cardDeckConfig);
    const card = this.cardDeck.generateCard(this.cardDeck.baseWeights);
    this.cardDeck.addCardToDeck(card);
  }

  drawNewCard() {
    // get status of current hands
    // create weights on number and operator based on the hand status
    // along with the weight, generate the random number or operator
    // operator needs its weight for generating
    // construct Card with the value randomely selected
    // this.cards.add(card);
  }

  initHand(amount: number) {
    // while (amount--) {
    //     this.drawNewCard();
    // }
  }

  update() {
    this.cardSelection.align();
    this.align();
  }

  addCard(card: CardBase) {
    card.on(CardEvents.FOCUSON, this.focusOn, this);
    card.on(CardEvents.FOCUSOFF, this.focusOff, this);
    card.on(CardEvents.SELECTION, this.select, this);

    this.cards.add(card);
  }

  shuffle() {
    this.cards.shuffle();
  }

  align() {
    Actions.PlaceOnLine(this.cards.getAll("isSelected", false), this.handLine);

    const focusedCard = this.cards.getFirst("isFocused", true) as CardBase;
    if (focusedCard?.input?.hitArea instanceof Geom.Rectangle) {
      const focus = this.cardHandConfig.focus;
      focusedCard.x -= focus.diffX;
      focusedCard.y -= focus.diffY;
    }

    // Actions.AlignTo(this.cardHand.getChildren(), Display.Align.RIGHT_CENTER, 10, 30);
    // const ellipse = new Geom.Ellipse(400, 300, 400, 200);
    // Actions.PlaceOnEllipse(this.cardHand.getChildren(), ellipse, Math.PI, 0);
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

  select(card: CardBase) {
    if (card.getIsFocused()) {
      this.focusOff(card);
    }

    if (card.getIsSelected()) {
      this.cardSelection.unsetCardFromSlot(card);

      card.setIsSelected(false);
      return;
    }

    if (this.cardSelection.setCardToSlot(card)) {
      card.setIsSelected(true);
      return;
    }
  }

  getSelectedCards() {
    return this.cardSelection.getSelectedCards();
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
