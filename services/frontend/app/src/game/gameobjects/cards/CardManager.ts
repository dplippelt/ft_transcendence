import type { Scene } from "phaser";
import CardDeck, { cardDeckConfig } from "./CardDeck";
import CardHand, { cardHandConfig } from "./CardHand";
import CardSelection, { cardSelectionConfig } from "./CardSelection";
import CardBase, { CardEvents } from "./CardBase";
import type { PlayerStatus } from "../../scenes/CombatScene";
import { EventBus } from "../../EventBus";
import { CombatEvent } from "../../../utils/utils";

interface CardManagerConfig {
  maxNumCardsInHand: number;
}

export const cardManagerConfig: CardManagerConfig = {
  maxNumCardsInHand: 8,
};

export default class CardManager {
  readonly scene: Scene;
  readonly playerStatus: PlayerStatus;
  readonly config: CardManagerConfig;
  readonly cardDeck: CardDeck;
  readonly cardHand: CardHand;
  readonly cardSelection: CardSelection;

  constructor(scene: Scene, playerStatus: PlayerStatus, config: CardManagerConfig) {
    this.scene = scene;
    this.playerStatus = playerStatus;
    this.config = config;
    this.cardDeck = new CardDeck(this.scene, cardDeckConfig);
    this.cardHand = new CardHand(this.scene, cardHandConfig);
    this.cardSelection = new CardSelection(this.scene, cardSelectionConfig);

    scene.input.setTopOnly(true);
    EventBus.addListener(CombatEvent.draw, this.drawExtraCard, this);
    EventBus.addListener(CombatEvent.reset, this.resetSelection, this);
  }

  resetSelection() {
    this.cardSelection.unsetAllCards();
  }

  clearHand() {
    this.cardHand.clearHand();
  }

  fillCardHand(amount: number) {
    for (let i = 0; i < amount; ++i) {
      this.drawCard();
    }
  }

  drawCard() {
    if (this.cardHand.numCards >= this.config.maxNumCardsInHand) {
      return false;
    }

    const card = this.cardDeck.dealCard();
    card.on(CardEvents.SELECTION, this.select, this);
    this.cardHand.addCard(card);
    return true;
  }

  drawExtraCard() {
    if (this.playerStatus.mana <= 0) {
      return;
    }
    if (this.drawCard()) {
      this.playerStatus.mana--;
      EventBus.emit(CombatEvent.updatePlayerMP, this.playerStatus.mana);
    }
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
