import Phaser, { Actions, Geom, Scene } from "phaser";
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

export default class CombatLayoutManager {
  private readonly combatManger: CombatManager;
  private readonly cardManager: CardManager;
  private readonly scene: Scene;
  private width: number;
  private height: number;
  private centerX: number;
  private centerY: number;
  private config!: CombatLayoutConfig;
  private handLine!: Geom.Line;

  constructor(combatManger: CombatManager) {
    this.combatManger = combatManger;
    this.cardManager = this.combatManger.cardManager;
    this.scene = combatManger.scene;
    this.width = 0;
    this.height = 0;
    this.centerX = 0;
    this.centerY = 0;
  }

  generateConfig() {
    const config: CombatLayoutConfig = {
      cards: {
        hand: {
          startX: this.centerX / 3,
          startY: this.height - this.centerY / 3,
          endX: this.width - this.centerX / 3,
          endY: this.height - this.centerY / 3,
          focus: {
            diffX: 0,
            diffY: 50,
          },
        },
        selection: {
          gridOptions: {
            width: -1,
            cellWidth: 50,
            x: this.centerX / 2,
            y: this.centerY / 4,
          },
        },
      },
      buttons: {
        execute: {
          x: this.centerX / 4,
          y: this.centerY / 4,
        },
        drawNewCard: {
          x: this.centerX / 4,
          y: this.centerY / 2,
        },
        resetSelection: {
          x: this.centerX / 4,
          y: this.centerY,
        },
      },
    };

    return config;
  }

  align() {
    this.width = this.scene.scale.width;
    this.height = this.scene.scale.height;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.config = this.generateConfig();
    this.setButtonPositions();
    this.handLine = new Geom.Line(
      this.config.cards.hand.startX,
      this.config.cards.hand.startY,
      this.config.cards.hand.endX,
      this.config.cards.hand.endY,
    );
    const focus = this.config.cards.hand.focus;
    this.cardManager.cardHand.setFocusDiff(focus.diffX, focus.diffY);
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
