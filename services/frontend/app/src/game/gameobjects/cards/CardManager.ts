import type { Scene } from "phaser";
import CardDeck, { cardDeckConfig } from "./CardDeck";
import CardHand, { cardHandConfig } from "./CardHand";
import CardSelection, { cardSelectionConfig } from "./CardSelection";
import CardBase, { CardEvents } from "./CardBase";
import Button, { type ButtonConfig } from "../utils/Button";
import { buttonContentConfig, buttonStyleConfig } from "../utils/buttonConfig";

const drawButtonCOnfig: ButtonConfig = {
    styleConfig: buttonStyleConfig,
    textConfig: buttonContentConfig,
}

export default class CardManager {
  readonly scene: Scene;
  readonly cardDeck: CardDeck;
  readonly cardHand: CardHand;
  readonly cardSelection: CardSelection;
  readonly drawButton: Button;

  constructor(scene: Scene) {
    this.scene = scene;
    this.cardDeck = new CardDeck(this.scene, cardDeckConfig);
    this.cardHand = new CardHand(this.scene, cardHandConfig);
    this.cardSelection = new CardSelection(this.scene, cardSelectionConfig);
    this.drawButton = new Button(scene, "draw", drawButtonCOnfig);
    this.drawButton.setPosition(100, 100);

    scene.input.setTopOnly(true);
    this.drawButton.on("pointerdown", this.drawCard, this);
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
