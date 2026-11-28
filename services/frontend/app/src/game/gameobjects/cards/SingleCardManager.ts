import type { Scene } from "phaser";
import CardManagerBase, { CardActionEvents } from "./CardManagerBase";
import CardDeck, { cardDeckConfig } from "./CardDeck";
import CardBase, { CardEvents } from "./CardBase";

export default class SingleCardManager extends CardManagerBase {
  readonly cardDeck: CardDeck;

  constructor(scene: Scene) {
    super(scene);
    this.cardDeck = new CardDeck(cardDeckConfig);
  }

  fillCardHand(amount: number) {
    for (let i = 0; i < amount; ++i) {
      this.drawCard();
    }
  }

  drawCard() {
    if (!this.cardHand.isUnderHandLimit(this.maxNumCardsInHand)) {
      return false;
    }

    if (this.cardDeck.isEmpty()) {
      this.cardDeck.initDeck();
    }
    const card = new CardBase(this.scene, this.cardDeck.dealCard()!)
    this.scene.add.existing(card);
    card.on(CardEvents.SELECTION, this.select, this);

    this.cardHand.addCard(card);
    this.events.emit(CardActionEvents.DRAW, card);
    return true;
  }
}
