import Phaser, { Scene } from "phaser";
import CardBase from "./CardBase";
import CardSlot, { cardSlotStyleConfig } from "./CardSlot";
import { type StyledBoxConfig } from "../utils/StyledBox";

interface CardSelectionConfig {
  selectionLimit: number;
}

export const cardSelectionConfig: CardSelectionConfig = {
  selectionLimit: 7,
};

export default class CardSelection {
  private readonly cardSlotStyleConfig!: StyledBoxConfig;
  private readonly cardSelectionConfig: CardSelectionConfig;
  private readonly slots!: Phaser.GameObjects.Container;
  private numSlots!: number;

  constructor(scene: Scene, config: CardSelectionConfig) {
    this.cardSlotStyleConfig = cardSlotStyleConfig;
    this.cardSelectionConfig = config;

    this.slots = scene.add.container(0, 0);

    this.numSlots = this.cardSelectionConfig.selectionLimit;

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
    const slots = this.slots.getAll() as CardSlot[];

    for (const slot of slots) {
      const card = slot.getCard();
      if (card) {
        card.emit("pointerdown");
      }
    }
  }

  getSelectionSlots() {
    return this.slots.getAll() as CardSlot[];
  }
}
