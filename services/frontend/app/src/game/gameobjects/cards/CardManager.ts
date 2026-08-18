import Phaser, { Scene } from "phaser";
import CardDeck, { cardDeckConfig } from "./CardDeck";
import CardHand from "./CardHand";
import CardSelection, { cardSelectionConfig } from "./CardSelection";
import CardBase, { CardEvents } from "./CardBase";
import Button, { type ButtonConfig } from "../utils/Button";
import { buttonContentConfig, buttonStyleConfig } from "../utils/buttonConfig";
import type { PlayerStatus } from "../../scenes/CombatScene";

export enum CardActionEvents {
  DRAW = "draw",
  DISCARD = "discard",
  SELECT = "select",
  UNSELECT = "unselect",
}

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
  readonly events: Phaser.Events.EventEmitter;

  constructor(scene: Scene, playerStatus: PlayerStatus, config: CardManagerConfig) {
    this.scene = scene;
    this.playerStatus = playerStatus;
    this.config = config;
    this.cardDeck = new CardDeck(this.scene, cardDeckConfig);
    this.cardHand = new CardHand(this.scene);
    this.cardSelection = new CardSelection(this.scene, cardSelectionConfig);
    this.drawButton = new Button(scene, "draw", drawButtonConfig);
    this.selectionResetButton = new Button(scene, "reset", selectionResetButtonConfig);
    this.events = new Phaser.Events.EventEmitter();

    scene.input.setTopOnly(true);
    this.drawButton.on("pointerdown", this.drawExtraCard, this);
    this.selectionResetButton.on("pointerdown", this.resetSelection, this);
  }

  resetSelection() {
    this.cardSelection.unsetAllCards();
  }

  clearHand() {
    this.events.emit(CardActionEvents.DISCARD, this.cardHand);
    this.cardHand.clearHand();
  }

  fillCardHand(amount: number) {
    for (let i = 0; i < amount; ++i) {
      this.drawCard();
    }
  }

  drawCard() {
    if (!this.cardHand.isUnderHandLimit(this.config.maxNumCardsInHand)) {
      return false;
    }

    const card = this.cardDeck.dealCard();
    card.on(CardEvents.SELECTION, this.select, this);
    this.cardHand.addCard(card);

    this.events.emit(CardActionEvents.DRAW, card);
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
      card.focusOff();
    }

    if (card.getIsSelected()) {
      this.cardSelection.unsetCardFromSlot(card);
      card.setIsSelected(false);
      this.events.emit(CardActionEvents.UNSELECT, card);
      return;
    }

    const slot = this.cardSelection.setCardToSlot(card);
    if (slot !== null) {
      card.setIsSelected(true);
      this.events.emit(CardActionEvents.SELECT, card, slot);
      return;
    }
  }
}
