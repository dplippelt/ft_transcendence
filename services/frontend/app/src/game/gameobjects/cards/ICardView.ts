import Phaser from "phaser";
import type CardHand from "./CardHand";
import type CardSelection from "./CardSelection";

export interface ICardView {
  readonly cardHand: CardHand;
  readonly cardSelection: CardSelection;
  readonly events: Phaser.Events.EventEmitter;
  readonly maxNumCardsInHand: number;
}
