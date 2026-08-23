import Phaser, { Scene } from "phaser";
import CardDeck, { cardDeckConfig } from "./CardDeck";
import CardHand from "./CardHand";
import CardSelection from "./CardSelection";
import CardBase, { CardEvents } from "./CardBase";
import type { PlayerStatus } from "../../scenes/CombatScene";
import { EventBus } from "../../EventBus";
import { CombatEvent } from "../../../utils/utils";

export enum CardActionEvents {
  DRAW = "draw",
  SELECT = "select",
  UNSELECT = "unselect",
  GENERATE_DECK = "generateDeck",
}

export default class CardManager {
  readonly scene: Scene;
  readonly playerStatus: PlayerStatus;
  readonly cardDeck: CardDeck;
  readonly cardHand: CardHand;
  readonly cardSelection: CardSelection;
  readonly events: Phaser.Events.EventEmitter;
  readonly maxNumCardsInHand: number;

  constructor(scene: Scene, playerStatus: PlayerStatus) {
    this.scene = scene;
    this.playerStatus = playerStatus;
    this.cardDeck = new CardDeck(this.scene, cardDeckConfig);
    this.cardHand = new CardHand(this.scene);
    this.cardSelection = new CardSelection(this.scene);
    this.events = new Phaser.Events.EventEmitter();
    this.maxNumCardsInHand = 8;

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
    if (!this.cardHand.isUnderHandLimit(this.maxNumCardsInHand)) {
      return false;
    }

    if (this.cardDeck.isEmpty()) {
        this.cardDeck.initDeck();
        this.events.emit(CardActionEvents.GENERATE_DECK);
    }
    const card = this.cardDeck.dealCard()!;
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
      EventBus.emit(CombatEvent.updatePlayerMP, this.playerStatus.mana);
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
      this.events.emit(CardActionEvents.SELECT, slot);
      return;
    }
  }
}
