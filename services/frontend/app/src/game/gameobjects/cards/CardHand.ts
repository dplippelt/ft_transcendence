import { Scene, GameObjects, Geom } from "phaser";
import CardBase, { CardEvents } from "./CardBase";

export default class CardHand {
  private readonly cards!: GameObjects.Container;
  //   private readonly handLine!: Geom.Line;
  numCards: number;
  private focusDiffX: number;
  private focusDiffY: number;

  constructor(scene: Scene) {
    this.cards = scene.add.container(0, 0);
    this.numCards = 0;
    this.focusDiffX = 0;
    this.focusDiffY = 0;
  }

  addCard(card: CardBase) {
    card.on(CardEvents.FOCUSON, this.focusOn, this);
    card.on(CardEvents.FOCUSOFF, this.focusOff, this);
    this.cards.add(card);
    this.numCards++;
  }

  // TODO: reconsider if reusing cards is really necessary
  clearHand() {
    const cards = this.cards.getAll() as CardBase[];
    for (const card of cards) {
      card.setVisible(false);
    }
    this.cards.removeAll(false);
    this.numCards = 0;
  }

  getHandCards() {
    return this.cards;
  }

  setFocusDiff(x: number, y: number) {
    this.focusDiffX = x;
    this.focusDiffY = y;
  }

  focusOn(card: CardBase) {
    if (card.getIsSelected()) return;

    card.setIsFocused(true);

    if (card.input?.hitArea instanceof Geom.Rectangle) {
      card.input.hitArea.right += this.focusDiffX;
      card.input.hitArea.bottom += this.focusDiffY;
    }
  }

  focusOff(card: CardBase) {
    card.setIsFocused(false);

    if (card.input?.hitArea instanceof Geom.Rectangle) {
      card.input.hitArea.right -= this.focusDiffX;
      card.input.hitArea.bottom -= this.focusDiffY;
    }
  }
}
