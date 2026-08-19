import Phaser, { Actions, Scene } from "phaser";
import CombatManager from "./CombatManager";
import type CardBase from "./cards/CardBase";
import type CardManager from "./cards/CardManager";
import CombatPlayer from "./CombatPlayer";
import type CombatEnemy from "./CombatEnemy";
import CombatAnimation from "./CombatAnimation";
import { CardActionEvents } from "./cards/CardManager";

interface CombatLayoutBase {
  width: number;
  height: number;
}

const combatLayoutBase: CombatLayoutBase = {
  width: 1280,
  height: 780,
};

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
    deck: {
      x: number;
      y: number;
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
    deck: {
      x: 500,
      y: 200,
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

export enum LayoutData {
  X = "offsetX",
  Y = "offsetY",
  ANGLE = "offsetAngle",
}

export default class CombatLayoutManager {
  readonly combatManger: CombatManager;
  readonly scene: Scene;
  readonly cardManager: CardManager;
  readonly player: CombatPlayer;
  readonly enemy: CombatEnemy;
  readonly layoutFromCenter: LayoutFromCenter;
  readonly layoutBase: CombatLayoutBase;
  readonly anims: CombatAnimation;

  constructor(combatManger: CombatManager) {
    this.combatManger = combatManger;
    this.scene = this.combatManger.scene;
    this.cardManager = this.combatManger.cardManager;
    this.player = this.combatManger.player;
    this.enemy = this.combatManger.enemy;
    this.layoutFromCenter = layoutFromCenter;
    this.layoutBase = combatLayoutBase;
    this.anims = new CombatAnimation(this);
    this.align();
    this.scene.scale.on("resize", () => {
      this.align();
    });
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
    this.alignDeck(centerX, centerY, baseScale);
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

  alignDeck(centerX: number, centerY: number, scale: number) {
    const deck = this.cardManager.cardDeck.getDeck();
    const diff = this.layoutFromCenter.cards.deck;
    const targetX = centerX + diff.x * scale;
    const targetY = centerY + diff.y * scale;

    deck.forEach((card: CardBase) => {
      card.setPosition(targetX, targetY);
      card.setData({ [LayoutData.X]: targetX, [LayoutData.Y]: targetY });
    });

    const cover = this.cardManager.cardDeck.getCover();
    cover.setPosition(targetX, targetY);
    cover.setData({ [LayoutData.X]: targetX, [LayoutData.Y]: targetY });
  }

  alignCardHand(centerX: number, centerY: number, scale: number) {
    const handCards = this.cardManager.cardHand.getHandCards().getAll() as CardBase[];
    const totalCards = handCards.length;
    if (!totalCards) {
      return;
    }

    const diff = this.layoutFromCenter.cards.hand;
    const ground = centerY + diff.y * scale;
    const cardSpace = Math.min(100 * scale, (centerX * 2 * 0.6) / totalCards);
    const totalHandWidth = cardSpace * (totalCards - 1);
    const startX = centerX - totalHandWidth / 2;

    handCards.forEach((card: CardBase, index: number) => {
      const targetX = startX + index * cardSpace;
      const offsetFromCenter = (index - (totalCards - 1) / 2) / (totalCards / 2);
      const curveY = Math.pow(offsetFromCenter, 2) * 30 * scale;
      const targetY = ground + curveY;
      const targetAngle = offsetFromCenter * 10;
      card.setData({ [LayoutData.X]: targetX, [LayoutData.Y]: targetY, [LayoutData.ANGLE]: targetAngle });
      if (card.getIsSelected()) {
        return;
      }
      this.scene.tweens.add({
        targets: card,
        x: card.getData(LayoutData.X),
        y: card.getData(LayoutData.Y),
        angle: card.getData(LayoutData.ANGLE),
        // scaleX: scale,
        // scaleY: scale,
        displayWidth: card.width,
        displayHeight: card.height,
        duration: 300,
        ease: "Power2",
      });
    });
  }

  alignSelectionSlots(centerX: number, centerY: number, scale: number) {
    const selectionSlots = this.cardManager.cardSelection.getSelectionSlots();
    const diff = this.layoutFromCenter.cards.selection;
    const targetX = centerX + diff.startX * scale;
    const targetY = centerY + diff.startY * scale;
    const gridOptions: Phaser.Types.Actions.GridAlignConfig = {
      width: -1,
      cellWidth: 50,
      x: targetX,
      y: targetY,
    };

    Actions.GridAlign(selectionSlots, gridOptions);
    for (const slot of selectionSlots) {
      const card = slot.getCard();
      if (card !== null) {
        this.cardManager.events.emit(CardActionEvents.SELECT, card, slot);
      }
    }
  }

  alignPlayer(centerX: number, centerY: number, scale: number) {
    const diff = this.layoutFromCenter.player;
    const targetX = centerX + diff.x * scale;
    const targetY = centerY + diff.y * scale;
    this.player.setPosition(targetX, targetY);
  }

  alignEnemy(centerX: number, centerY: number, scale: number) {
    const diff = this.layoutFromCenter.enemy;
    const targetX = centerX + diff.x * scale;
    const targetY = centerY + diff.y * scale;
    this.enemy.setPosition(targetX, targetY);
  }
}
