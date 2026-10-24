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

  unsetAllCards() {
    const selectedCards = this.getSelectedCards();

    for (const card of selectedCards) {
      card.emit("pointerdown");
    }
  }

  getSelectionSlots() {
    return this.slots.getAll() as CardSlot[];
  }

  getNumSlots() {
    return this.numSlots;
  }
}
