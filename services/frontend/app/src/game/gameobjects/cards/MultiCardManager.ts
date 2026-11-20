import type { Scene } from "phaser";
import CardManagerBase, { CardActionEvents } from "./CardManagerBase";
import type { CombatCard } from "../../network/CombatTypes";
import CardBase, { CardEvents } from "./CardBase";

export default class MultiCardManager extends CardManagerBase {
  private readonly cardsById = new Map<string, CardBase>();

  constructor(scene: Scene) {
    super(scene);
  }

  syncHand(hand: CombatCard[]) {
    this.resetSelection();
    this.clearHand();
    this.cardsById.clear();

    for (const { id, value } of hand) {
      const card = new CardBase(this.scene, value);
      this.scene.add.existing(card);
      card.setData("id", id);
      card.on(CardEvents.SELECTION, this.select, this);
      this.cardsById.set(id, card);
      this.cardHand.addCard(card);
      this.events.emit(CardActionEvents.DRAW, card);
    }
  }

  getSelectedCardIds() {
    return this.cardSelection.getSelectedCards().map((card) => card.getData("id") as string);
  }

  lockSelection(locked: boolean) {
    /* disable input on hand cards while waiting for the server */
  }
}
