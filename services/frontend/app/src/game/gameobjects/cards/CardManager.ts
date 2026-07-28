import type { Scene } from "phaser";
import CardDeck, { cardDeckConfig } from "./CardDeck";
import CardHand, { cardHandConfig } from "./CardHand";
import CardSelection, { cardSelectionConfig } from "./CardSelection";
import CardBase, { CardEvents } from "./CardBase";
import Button, { type ButtonConfig } from "../utils/Button";
import { buttonContentConfig, buttonStyleConfig } from "../utils/buttonConfig";
import type { PlayerStatus } from "../../scenes/CombatScene";

const drawButtonConfig: ButtonConfig = {
  styleConfig: buttonStyleConfig,
  textConfig: buttonContentConfig,
};

const selectionResetButtonConfig: ButtonConfig = {
  styleConfig: buttonStyleConfig,
  textConfig: buttonContentConfig,
};

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
  readonly drawButton: Button;
  readonly selectionResetButton: Button;

  constructor(scene: Scene, playerStatus: PlayerStatus, config: CardManagerConfig) {
    this.scene = scene;
    this.playerStatus = playerStatus;
    this.config = config;
    this.cardDeck = new CardDeck(this.scene, cardDeckConfig);
    this.cardHand = new CardHand(this.scene, cardHandConfig);
    this.cardSelection = new CardSelection(this.scene, cardSelectionConfig);
    this.drawButton = new Button(scene, "draw", drawButtonConfig);
    this.drawButton.setPosition(100, 100);
    this.selectionResetButton = new Button(scene, "reset", selectionResetButtonConfig);
    this.selectionResetButton.setPosition(100, 200);

    scene.input.setTopOnly(true);
    this.drawButton.on("pointerdown", this.drawExtraCard, this);
    this.selectionResetButton.on("pointerdown", this.resetSelection, this);
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
