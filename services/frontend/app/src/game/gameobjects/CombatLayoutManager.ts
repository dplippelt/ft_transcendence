import Phaser, { Actions, Geom } from "phaser";
import CombatManager from "./CombatManager";
import type CardBase from "./cards/CardBase";
import type CardManager from "./cards/CardManager";

interface CombatLayoutConfig {
  cards: {
    hand: {
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      focus: {
        diffX: number;
        diffY: number;
      };
    };
    selection: {
      gridOptions: Phaser.Types.Actions.GridAlignConfig;
    };
  };
  buttons: {
    execute: {
      x: number;
      y: number;
    };
    drawNewCard: {
      x: number;
      y: number;
    };
    resetSelection: {
      x: number;
      y: number;
    };
  };
}

export const combatLayoutConfig: CombatLayoutConfig = {
  cards: {
    hand: {
      startX: 100,
      startY: 400,
      endX: 800,
      endY: 400,
      focus: {
        diffX: 0,
        diffY: 50,
      },
    },
    selection: {
      gridOptions: {
        width: -1,
        cellWidth: 100,
        x: 200,
        y: 100,
      },
    },
  },
  buttons: {
    execute: {
      x: 100,
      y: 50,
    },
    drawNewCard: {
      x: 100,
      y: 100,
    },
    resetSelection: {
      x: 100,
      y: 150,
    },
  },
};

export default class CombatLayoutManager {
  private readonly combatManger: CombatManager;
  private readonly cardManager: CardManager;
  private readonly config: CombatLayoutConfig;
  private readonly handLine: Geom.Line;

  constructor(combatManger: CombatManager, config: CombatLayoutConfig) {
    this.combatManger = combatManger;
    this.cardManager = this.combatManger.cardManager;
    this.config = config;
    this.handLine = new Geom.Line(
      this.config.cards.hand.startX,
      this.config.cards.hand.startY,
      this.config.cards.hand.endX,
      this.config.cards.hand.endY,
    );
    this.setButtonPositions();
    const focus = config.cards.hand.focus;
    this.cardManager.cardHand.setFocusDiff(focus.diffX, focus.diffY);
  }

  align() {
    this.alignCardHand();
    this.alignSelectionSlots();
  }

  alignCardHand() {
    const handCards = this.cardManager.cardHand.getHandCards();
    const config = this.config.cards.hand;

    Actions.PlaceOnLine(handCards.getAll("isSelected", false), this.handLine);

    const focusedCard = handCards.getFirst("isFocused", true) as CardBase;
    if (focusedCard?.input?.hitArea instanceof Geom.Rectangle) {
      const focus = config.focus;
      focusedCard.x -= focus.diffX;
      focusedCard.y -= focus.diffY;
    }
  }

  alignSelectionSlots() {
    const selectionSlots = this.cardManager.cardSelection.getSelectionSlots();
    const config = this.config.cards.selection;

    Actions.GridAlign(selectionSlots, config.gridOptions);

    for (const slot of selectionSlots) {
      slot.setCardPosition();
    }
  }

  setButtonPositions() {
    const executeButton = this.combatManger.executeButton;
    const drawButton = this.cardManager.drawButton;
    const resetButton = this.cardManager.selectionResetButton;
    const config = this.config.buttons;

    executeButton.setPosition(config.execute.x, config.execute.y);
    drawButton.setPosition(config.drawNewCard.x, config.drawNewCard.y);
    resetButton.setPosition(config.resetSelection.x, config.resetSelection.y);
  }
}
