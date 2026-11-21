import Phaser, { Scene } from "phaser";
import CardHand from "./CardHand";
import CardSelection from "./CardSelection";
import type { ICardView } from "./ICardView";
import CardBase from "./CardBase";

export enum CardActionEvents {
  DRAW = "draw",
  SELECT = "select",
  UNSELECT = "unselect",
  TRASH_CARD = "trashCard",
}

export default class CardManagerBase implements ICardView {
  readonly scene: Scene;
  readonly cardHand: CardHand;
  readonly cardSelection: CardSelection;
  readonly events: Phaser.Events.EventEmitter;
  readonly maxNumCardsInHand: number = 8;

  constructor(scene: Scene) {
    this.scene = scene;
    this.cardHand = new CardHand(this.scene);
    this.cardSelection = new CardSelection(this.scene);
    this.events = new Phaser.Events.EventEmitter();
    scene.input.setTopOnly(true);
  }

  resetSelection() {
    this.cardSelection.unsetAllCards();
  }

  clearHand() {
    const cards = this.cardHand.getHandCards();
    for (const card of cards) {
      this.cardHand.removeCard(card);
      this.events.emit(CardActionEvents.TRASH_CARD, card);
    }
  }

  shiftSelectedCards() {
    const slots = this.cardSelection.getSelectionSlots();
    const numSlots = this.cardSelection.getNumSlots();

    for (let i = 0; i < numSlots - 1; i++) {
      if (slots[i].isCardSet()) continue;

      const currentSlot = slots[i];
      const nextSlot = slots[i + 1];

      if (nextSlot.isCardSet()) {
        const nextCard = nextSlot.getCard()!;
        nextSlot.unsetCard();
        currentSlot.setCard(nextCard);
      }
    }
  }

  select(card: CardBase) {
    if (card.getIsFocused()) {
      card.focusOff();
    }

    if (card.getIsSelected()) {
      this.cardSelection.unsetCardFromSlot(card);
      this.shiftSelectedCards();
      card.setIsSelected(false);
      this.events.emit(CardActionEvents.UNSELECT, card);
      return;
    }

    const slot = this.cardSelection.setCardToSlot(card);
    if (slot !== null) {
      card.setIsSelected(true);
      this.events.emit(CardActionEvents.SELECT, slot);
      return;
    }
  }
}
