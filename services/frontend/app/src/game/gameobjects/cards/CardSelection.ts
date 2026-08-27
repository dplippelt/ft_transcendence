import Phaser, { Scene } from "phaser";
import CardBase from "./CardBase";
import CardSlot, { cardSlotStyleConfig } from "./CardSlot";
import { type StyledBoxConfig } from "../utils/StyledBox";

export default class CardSelection {
  private readonly cardSlotStyleConfig!: StyledBoxConfig;
  private slots!: Phaser.GameObjects.Container;
  private readonly numSlots: number;

  constructor(scene: Scene) {
    this.cardSlotStyleConfig = cardSlotStyleConfig;
    this.slots = scene.add.container(0, 0);
    this.numSlots = 7;

    for (let i = 0; i < this.numSlots; ++i) {
      this.slots.add(new CardSlot(scene, this.cardSlotStyleConfig));
    }
  }

  setCardToSlot(card: CardBase) {
    const slots = this.slots.getAll() as CardSlot[];

    for (let i = 0; i < this.numSlots; ++i) {
      const slot = slots[i];

      if (slot.isCardSet()) continue;

      slot.setCard(card);

      return slot;
    }

    return null;
  }

  unsetCardFromSlot(card: CardBase): boolean {
    const slots = this.slots.getAll() as CardSlot[];

    for (let i = 0; i < this.numSlots; ++i) {
      const slot = slots[i];

      if (!slot.isCardMatch(card)) continue;

      slot.unsetCard();

      // Shift cards left to fill the empty slot in the array
      for (let j = i + 1; j < this.numSlots; j++) {
        const currentSlot = slots[j - 1];
        const nextSlot = slots[j];

        if (nextSlot.isCardSet()) {
          const nextCard = nextSlot.getCard()!;
          nextSlot.unsetCard();
          currentSlot.setCard(nextCard);
        }
      }

      return true;
    }

    return false;
  }

  getSelectedCards(): CardBase[] {
    const slots = this.slots.getAll() as CardSlot[];
    const selectedCards: CardBase[] = [];

    for (let i = 0; i < this.numSlots; ++i) {
      const slot = slots[i];

      if (!slot.isCardSet()) continue;

      const card = slot.getCard() as CardBase;

      selectedCards.push(card);
    }

    return selectedCards;
  }

  // NOTE to Takato: I had to change the unsetAllCards() approach because
  // I implemented a feature in unsetCardFromSlot() so that the cards in
  // the slots shift left when you remove/unselect a card from the selection
  // slots (so that when you unselect a card and then add a new one, the new
  // card is always added to the end of the selection slots).
  // The old unsetAllCards() was iterating over the slots and unselecting
  // them inside the loop (which calls unsetCardFromSlot() through the emit()),
  // which then would shift the cards in the slots array you're currently
  // looping over (resulting in skipping a card in your loop).
  // The new approach first gets an array of selected cards (independent of the
  // slots array) and loops over that array to unselect those cards specifically.
  unsetAllCards() {
    const slots = this.slots.getAll() as CardSlot[];
    const selectedCards: CardBase[] = [];

    for (const slot of slots) {
      const card = slot.getCard();
      if ( card !== null )
        selectedCards.push(card);
    }

    for (const card of selectedCards) {
      card.emit("pointerdown");
    }
  }

  getSelectionSlots() {
    return this.slots.getAll() as CardSlot[];
  }
}
