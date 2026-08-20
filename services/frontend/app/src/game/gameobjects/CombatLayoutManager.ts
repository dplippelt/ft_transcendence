import Phaser, { Actions, Scene } from "phaser";
import CombatManager from "./CombatManager";
import type CardBase from "./cards/CardBase";
import type CardManager from "./cards/CardManager";
import CombatPlayer from "./CombatPlayer";
import type CombatEnemy from "./CombatEnemy";
import CombatAnimation from "./CombatAnimation";
import { CardActionEvents } from "./cards/CardManager";
import type CardSlot from "./cards/CardSlot";

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

export enum LayoutEvents {
  SET_CARD_POS = "setCardPos",
  // SET_DECK_CARD_POS = "setDeckCardPos",
  // SET_HAND_CARD_POS = "setHandCardPos",
  SET_CARD_TO_SLOT = "setSelectionSlotsPos",
  SET_COMBATANT_POS = "setCombatantPos",
}

export default class CombatLayoutManager {
  readonly combatManger: CombatManager;
  readonly scene: Scene;
  readonly cardManager: CardManager;
  readonly player: CombatPlayer;
  readonly enemy: CombatEnemy;
  readonly layoutFromCenter: LayoutFromCenter;
  readonly layoutBase: CombatLayoutBase;
  readonly events: Phaser.Events.EventEmitter;
  readonly anims: CombatAnimation;

  constructor(combatManger: CombatManager) {
    this.combatManger = combatManger;
    this.scene = this.combatManger.scene;
    this.cardManager = this.combatManger.cardManager;
    this.cardManager.events.on(
      CardActionEvents.DRAW,
      () => {
        this.updateLayout(false);
      },
      this,
    );
    this.cardManager.events.on(CardActionEvents.SELECT, this.setCardToSlot, this);
    this.cardManager.events.on(CardActionEvents.UNSELECT, this.setCardPosition, this);

    this.player = this.combatManger.player;
    this.enemy = this.combatManger.enemy;
    this.layoutFromCenter = layoutFromCenter;
    this.layoutBase = combatLayoutBase;
    this.events = new Phaser.Events.EventEmitter();
    this.events.on(LayoutEvents.SET_CARD_POS, this.setCardPosition, this);
    this.events.on(LayoutEvents.SET_CARD_TO_SLOT, this.setCardToSlot, this);
    this.events.on(LayoutEvents.SET_COMBATANT_POS, this.setCombatantPositions, this);

    this.anims = new CombatAnimation(this);
    this.updateLayout();
    this.scene.scale.on("resize", () => {
      this.updateLayout();
    });
  }

  updateLayout(isResize: boolean = true) {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scaleX = width / this.layoutBase.width;
    const scaleY = height / this.layoutBase.height;
    const baseScale = Math.min(scaleX, scaleY);

    this.updateButtons(centerX, centerY, baseScale);
    this.updateDeck(centerX, centerY, baseScale, isResize);
    this.updateCardHand(centerX, centerY, baseScale, isResize);
    this.updateSelectionSlots(centerX, centerY, baseScale, isResize);
    this.updatePlayer(centerX, centerY, baseScale);
    this.updateEnemy(centerX, centerY, baseScale);
  }

  updateButtons(centerX: number, centerY: number, scale: number) {
    const executeButton = this.combatManger.executeButton;
    const drawButton = this.cardManager.drawButton;
    const resetButton = this.cardManager.selectionResetButton;
    const diff = this.layoutFromCenter.buttons;

    executeButton.setPosition(centerX + diff.execute.x * scale, centerY + diff.execute.y * scale);
    drawButton.setPosition(centerX + diff.drawCard.x * scale, centerY + diff.drawCard.y * scale);
    resetButton.setPosition(centerX + diff.resetSelection.x * scale, centerY + diff.resetSelection.y * scale);
  }

  updateDeck(centerX: number, centerY: number, scale: number, isResize: boolean) {
    const deck = this.cardManager.cardDeck.getDeck();
    const diff = this.layoutFromCenter.cards.deck;
    const targetX = centerX + diff.x * scale;
    const targetY = centerY + diff.y * scale;
    const angle = 0;

    deck.forEach((card: CardBase) => {
      card.setData({ [LayoutData.X]: targetX, [LayoutData.Y]: targetY, [LayoutData.ANGLE]: angle });
      if (isResize) {
        this.setCardPosition(card);
      } else {
        this.events.emit(LayoutEvents.SET_CARD_POS, card);
      }
    });

    const cover = this.cardManager.cardDeck.getCover();
    cover.setData({ [LayoutData.X]: targetX, [LayoutData.Y]: targetY, [LayoutData.ANGLE]: angle });
    if (isResize) {
      this.setCardPosition(cover);
    } else {
      this.events.emit(LayoutEvents.SET_CARD_POS, cover);
    }
  }

  updateCardHand(centerX: number, centerY: number, scale: number, isResize: boolean) {
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
      if (isResize) {
        this.setCardPosition(card);
      } else {
        this.events.emit(LayoutEvents.SET_CARD_POS, card);
      }
    });
  }

  updateSelectionSlots(centerX: number, centerY: number, scale: number, isResize: boolean) {
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
        if (isResize) {
          this.setCardToSlot(slot);
        } else {
          this.events.emit(LayoutEvents.SET_CARD_TO_SLOT, slot);
        }
      }
    }
  }

  updatePlayer(centerX: number, centerY: number, scale: number) {
    const diff = this.layoutFromCenter.player;
    const targetX = centerX + diff.x * scale;
    const targetY = centerY + diff.y * scale;
    this.player.setData({ [LayoutData.X]: targetX, [LayoutData.Y]: targetY });
    this.events.emit(LayoutEvents.SET_COMBATANT_POS, this.player);
  }

  updateEnemy(centerX: number, centerY: number, scale: number) {
    const diff = this.layoutFromCenter.enemy;
    const targetX = centerX + diff.x * scale;
    const targetY = centerY + diff.y * scale;
    this.enemy.setData({ [LayoutData.X]: targetX, [LayoutData.Y]: targetY });
    this.events.emit(LayoutEvents.SET_COMBATANT_POS, this.enemy);
  }

  setCardPosition(card: CardBase) {
    const x = card.getData(LayoutData.X);
    const y = card.getData(LayoutData.Y);
    const angle = card.getData(LayoutData.ANGLE);

    card.setPosition(x, y);
    card.angle = angle;
    card.displayWidth = card.width;
    card.displayHeight = card.height;
  }

  setCardToSlot(slot: CardSlot) {
    const card = slot.getCard()!;

    card.setPosition(slot.x, slot.y);
    card.angle = 0;
    card.displayWidth = card.width * 0.7;
    card.displayHeight = card.height * 0.7;
  }

  setCombatantPositions(combatant: CombatPlayer | CombatEnemy) {
    const targetX = combatant.getData(LayoutData.X);
    const targetY = combatant.getData(LayoutData.Y);

    combatant.setPosition(targetX, targetY);
  }
}
