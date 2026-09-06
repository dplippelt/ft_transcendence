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
  CLEAR_HAND = "clearHand",
  CLEAR_HAND_COMPLETE = "clearHandComplete",
}

export default class CardManager {
  readonly scene: Scene;
  readonly playerStatus: PlayerStatus;
  readonly cardDeck: CardDeck;
  readonly cardHand: CardHand;
  readonly cardSelection: CardSelection;
  readonly events: Phaser.Events.EventEmitter;
  readonly maxNumCardsInHand: number;
  private canRedraw: boolean;

  constructor(scene: Scene, playerStatus: PlayerStatus) {
    this.scene = scene;
    this.playerStatus = playerStatus;
    this.cardDeck = new CardDeck(this.scene, cardDeckConfig);
    this.cardHand = new CardHand(this.scene);
    this.cardSelection = new CardSelection(this.scene);
    this.events = new Phaser.Events.EventEmitter();
    this.maxNumCardsInHand = 8;
    this.canRedraw = true;

    scene.input.setTopOnly(true);
    this.events.on(CardActionEvents.CLEAR_HAND_COMPLETE, this.clearHandComplete, this);
    EventBus.addListener(CombatEvent.draw, this.redrawCards, this);
    // EventBus.addListener(CombatEvent.reset, this.resetSelection, this);
  }

  resetSelection() {
    this.cardSelection.unsetAllCards();
  }

  clearHand( isStartTurn: boolean ) {
    if ( isStartTurn ) {
      this.cardHand.clearHand(isStartTurn);
      this.canRedraw = true;
      return;
    }

    const cards = this.cardHand.getHandCards().getAll() as CardBase[];
    this.events.emit(CardActionEvents.CLEAR_HAND, cards);
    this.cardHand.clearHand(isStartTurn);
  }

  clearHandComplete() {
    this.fillCardHand(this.maxNumCardsInHand);
    this.canRedraw = true;
  }

  fillCardHand(amount: number) {
    for (let i = 0; i < amount; ++i) {
      this.drawCard();
    }
  }

  redrawCards() {
    if ( !this.canRedraw || this.playerStatus.mana <= 0) {
      return;
    }

    this.canRedraw = false;
    this.resetSelection();
    this.clearHand(false);
    this.playerStatus.mana--;
    EventBus.emit(CombatEvent.updatePlayerMP, this.playerStatus.mana);
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

  // drawExtraCard() {
  //   if (this.playerStatus.mana <= 0) {
  //     return;
  //   }
  //   if (this.drawCard()) {
  //     this.playerStatus.mana--;
  //     EventBus.emit(CombatEvent.updatePlayerMP, this.playerStatus.mana);
  //   }
  // }

  shiftCards() {
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
      this.shiftCards();
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
