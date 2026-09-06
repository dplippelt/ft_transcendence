import { Scene, GameObjects } from "phaser";
import CardBase from "./CardBase";

export default class CardHand {
  private readonly cards: GameObjects.Container;
  private numCards: number;

  constructor(scene: Scene) {
    this.cards = scene.add.container(0, 0);
    this.numCards = 0;
  }

  addCard(card: CardBase) {
    this.cards.add(card);
    this.numCards++;
  }

  clearHand( doDestroy: boolean ) {
    this.cards.removeAll(doDestroy);
    this.numCards = 0;
  }

  getHandCards() {
    return this.cards;
  }

  isUnderHandLimit(limit: number) {
    return this.numCards < limit;
  }
}
