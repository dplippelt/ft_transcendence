import type { Scene } from "phaser";
import CardDeck, { cardDeckConfig } from "./CardDeck";
import CardHand, { cardHandConfig } from "./CardHand";
import CardSelection, { cardSelectionConfig } from "./CardSelection";
import CardBase, { CardEvents } from "./CardBase";

export default class CardManager {
  readonly scene: Scene;
  readonly cardDeck: CardDeck;
  readonly cardHand: CardHand;
  readonly cardSelection: CardSelection;

  constructor(scene: Scene) {
    this.scene = scene;
    this.cardDeck = new CardDeck(this.scene, cardDeckConfig);
    this.cardHand = new CardHand(this.scene, cardHandConfig);
    this.cardSelection = new CardSelection(this.scene, cardSelectionConfig);

    scene.input.setTopOnly(true);
  }

  clearHandAndSelection() {
    this.cardSelection.unsetAllCards();
    this.cardHand.clearHand();
  }

  fillCardHand(amount: number) {
    for (let i = 0; i < amount; ++i) {
      this.drawCard();
    }
  }

  drawCard() {
    const card = this.cardDeck.dealCard();

    card.on(CardEvents.SELECTION, this.select, this);

    this.cardHand.addCard(card);
  }

  select(card: CardBase) {
    if (card.getIsFocused()) {
      this.cardHand.focusOff(card);
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

  alignAllCards() {
    this.cardHand.align();
    this.cardSelection.align();
  }
}
