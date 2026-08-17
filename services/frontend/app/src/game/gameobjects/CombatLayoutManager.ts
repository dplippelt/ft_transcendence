import Phaser, { Actions, Geom, Scene } from "phaser";
import CombatManager from "./CombatManager";
import type CardBase from "./cards/CardBase";
import type CardManager from "./cards/CardManager";
import type CombatPlayer from "./CombatPlayer";
import type CombatEnemy from "./CombatEnemy";

interface LayoutFromCenter {
  player: {
    x: number;
    y: number;
  };
  enemy: {
    x: number;
    y: number;
  };
  cards: {
    hand: {
      startX: number;
      endX: number;
      y: number;
    };
    selection: {
      startX: number;
      startY: number;
    };
  };
  buttons: {
    execute: {
      x: number;
      y: number;
    };
    drawCard: {
      x: number;
      y: number;
    };
    resetSelection: {
      x: number;
      y: number;
    };
  };
}

const layoutFromCenter: LayoutFromCenter = {
  player: {
    x: -300,
    y: 100,
  },
  enemy: {
    x: 300,
    y: 100,
  },
  cards: {
    hand: {
      startX: -400,
      endX: 400,
      y: 200,
    },
    selection: {
      startX: -200,
      startY: -200,
    },
  },
  buttons: {
    execute: {
      x: -100,
      y: -300,
    },
    drawCard: {
      x: 0,
      y: -300,
    },
    resetSelection: {
      x: 100,
      y: -300,
    },
  },
};

interface CombatLayoutBase {
  width: number;
  height: number;
}

const combatLayoutBase: CombatLayoutBase = {
  width: 1280,
  height: 780,
};

export default class CombatLayoutManager {
  private readonly combatManger: CombatManager;
  private readonly cardManager: CardManager;
  private readonly player: CombatPlayer;
  private readonly enemy: CombatEnemy;
  private readonly scene: Scene;
  private readonly layoutFromCenter: LayoutFromCenter;
  private readonly layoutBase: CombatLayoutBase;

  constructor(combatManger: CombatManager) {
    this.combatManger = combatManger;
    this.cardManager = this.combatManger.cardManager;
    this.player = this.combatManger.player;
    this.enemy = this.combatManger.enemy;
    this.scene = combatManger.scene;
    this.layoutFromCenter = layoutFromCenter;
    this.layoutBase = combatLayoutBase;
    // Needs to fix hard cord.
    this.cardManager.cardHand.setFocusDiff(0, 30);
    this.align();
  }

  align() {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scaleX = width / this.layoutBase.width;
    const scaleY = height / this.layoutBase.height;
    const baseScale = Math.min(scaleX, scaleY);

    this.alignButtons(centerX, centerY, baseScale);
    this.alignCardHand(centerX, centerY, baseScale);
    this.alignSelectionSlots(centerX, centerY, baseScale);
    this.alignPlayer(centerX, centerY, baseScale);
    this.alignEnemy(centerX, centerY, baseScale);
  }

  alignButtons(centerX: number, centerY: number, scale: number) {
    const executeButton = this.combatManger.executeButton;
    const drawButton = this.cardManager.drawButton;
    const resetButton = this.cardManager.selectionResetButton;
    const diff = this.layoutFromCenter.buttons;

    executeButton.setPosition(centerX + diff.execute.x * scale, centerY + diff.execute.y * scale);
    drawButton.setPosition(centerX + diff.drawCard.x * scale, centerY + diff.drawCard.y * scale);
    resetButton.setPosition(centerX + diff.resetSelection.x * scale, centerY + diff.resetSelection.y * scale);
  }

  alignCardHand(centerX: number, centerY: number, scale: number) {
    const handCards = this.cardManager.cardHand.getHandCards();
    const diff = this.layoutFromCenter.cards.hand;
    const ground = centerY + diff.y * scale;
    const handLine = new Geom.Line(centerX + diff.startX * scale, ground, centerX + diff.endX * scale, ground);

    Actions.PlaceOnLine(handCards.getAll("isSelected", false), handLine);

    const focusedCard = handCards.getFirst("isFocused", true) as CardBase;
    if (focusedCard?.input?.hitArea instanceof Geom.Rectangle) {
      // Needs to fix hard cord.
      focusedCard.x -= 0;
      focusedCard.y -= 30;
    }
  }

  alignSelectionSlots(centerX: number, centerY: number, scale: number) {
    const selectionSlots = this.cardManager.cardSelection.getSelectionSlots();
    const diff = this.layoutFromCenter.cards.selection;
    const gridOptions: Phaser.Types.Actions.GridAlignConfig = {
      width: -1,
      cellWidth: 50,
      x: centerX + diff.startX * scale,
      y: centerY + diff.startY * scale,
    };

    Actions.GridAlign(selectionSlots, gridOptions);
    for (const slot of selectionSlots) {
      slot.setCardPosition();
    }
  }

  alignPlayer(centerX: number, centerY: number, scale: number) {
    const diff = this.layoutFromCenter.player;

    this.player.setPosition(centerX + diff.x * scale, centerY + diff.y * scale);
  }

  alignEnemy(centerX: number, centerY: number, scale: number) {
    const diff = this.layoutFromCenter.enemy;

    this.enemy.setPosition(centerX + diff.x * scale, centerY + diff.y * scale);
  }
}
