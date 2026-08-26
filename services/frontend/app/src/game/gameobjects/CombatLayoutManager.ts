import Phaser, { Actions, Scene } from "phaser";
import CombatManager from "./CombatManager";
import type CardBase from "./cards/CardBase";
import type CardManager from "./cards/CardManager";
import CombatPlayer from "./CombatPlayer";
import type CombatEnemy from "./CombatEnemy";
import CombatAnimation from "./CombatAnimation";
import { CardActionEvents } from "./cards/CardManager";
import type CardSlot from "./cards/CardSlot";

interface CombatLayout {
  width: number;
  height: number;
  cardSize: {
    width: number;
    height: number;
  };
  player: {
    xFromCenter: number;
    yFromCenter: number;
    width: number;
    height: number;
  };
  enemy: {
    xFromCenter: number;
    yFromCenter: number;
    width: number;
    height: number;
  };
  button: {
    width: number;
    height: number;
    execute: {
      xFromCenter: number;
      yFromBottom: number;
    };
    resetSelection: {
      xFromCenter: number;
      yFromBottom: number;
    };
    draw: {
      xFromCenter: number;
      yFromBottom: number;
    };
  };
  cards: {
    hand: {
      width: number;
      yFromBottom: number;
    };
    selection: {
      startXFromCenter: number;
      endXFromCenter: number;
      cellWidth: number;
      yFromTop: number;
    };
    deck: {
      xFromCenter: number;
      yFromBottom: number;
    };
  };
}

const combatLayout: CombatLayout = {
  width: 960,
  height: 540,
  cardSize: {
    width: 64,
    height: 96,
  },
  player: {
    xFromCenter: -220,
    yFromCenter: 100,
    width: 79,
    height: 63,
  },
  enemy: {
    xFromCenter: 220,
    yFromCenter: 100,
    width: 37,
    height: 43,
  },
  button: {
    width: 100,
    height: 50,
    execute: {
      xFromCenter: 300,
      yFromBottom: -150,
    },
    resetSelection: {
      xFromCenter: -400,
      yFromBottom: -400,
    },
    draw: {
      xFromCenter: -400,
      yFromBottom: -300,
    },
  },
  cards: {
    hand: {
      width: 500,
      yFromBottom: -50,
    },
    selection: {
      startXFromCenter: -175,
      endXFromCenter: 175,
      cellWidth: 50,
      yFromTop: 100,
    },
    deck: {
      xFromCenter: -400,
      yFromBottom: -150,
    },
  },
};

interface Display {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  scale: number;
}

export enum TransformInLayout {
  X = "LayoutX",
  Y = "LayoutY",
  ANGLE = "LayoutAngle",
  SCALE = "LayoutScale",
}

export enum LayoutEvents {
  SET_CARD_POS = "setCardPos",
  SET_CARD_TO_SLOT = "setSelectionSlotsPos",
  SET_COMBATANT_POS = "setCombatantPos",
}

export default class CombatLayoutManager {
  readonly combatManger: CombatManager;
  readonly scene: Scene;
  readonly cardManager: CardManager;
  readonly player: CombatPlayer;
  readonly enemy: CombatEnemy;
  readonly events: Phaser.Events.EventEmitter;
  readonly anims: CombatAnimation;
  readonly layout: CombatLayout;
  readonly display!: Display;

  constructor(combatManger: CombatManager) {
    this.combatManger = combatManger;
    this.scene = this.combatManger.scene;
    this.cardManager = this.combatManger.cardManager;
    this.onCardActions();
    this.player = this.combatManger.player;
    this.enemy = this.combatManger.enemy;
    this.events = new Phaser.Events.EventEmitter();
    this.onLayoutActions();
    this.anims = new CombatAnimation(this);
    this.layout = combatLayout;
    this.display = { width: 0, height: 0, centerX: 0, centerY: 0, scale: 0 };
    this.updateDisplay();
    this.updateLayout();
    this.scene.scale.on("resize", this.updateLayout, this);
  }

  onCardActions() {
    this.cardManager.events.on(CardActionEvents.DRAW, this.updateCardHand, this);
    this.cardManager.events.on(CardActionEvents.SELECT, this.setCardToSlot, this);
    this.cardManager.events.on(CardActionEvents.UNSELECT, this.setCardPosition, this);
    this.cardManager.events.on(CardActionEvents.GENERATE_DECK, this.updateDeck, this);
  }

  onLayoutActions() {
    this.events.on(LayoutEvents.SET_CARD_POS, this.setCardPosition, this);
    this.events.on(LayoutEvents.SET_CARD_TO_SLOT, this.setCardToSlot, this);
    this.events.on(LayoutEvents.SET_COMBATANT_POS, this.setCombatantPositions, this);
  }

  updateDisplay() {
    this.display.width = this.scene.scale.width;
    this.display.height = this.scene.scale.height;
    this.display.centerX = this.display.width / 2;
    this.display.centerY = this.display.height / 2;
    const scaleX = this.display.width / this.layout.width;
    const scaleY = this.display.height / this.layout.height;
    this.display.scale = Math.min(scaleX, scaleY);

    // Calculating the horizontal inset for the Combat UI handled by react
    // to compensate for letterboxing around the background image
    const bgAspectX = 2; // must match background image aspect ratio (currently 2:1)
    const bgAspectY = 1;
    const bgScaleX = this.display.width / bgAspectX;
    const bgScaleY = this.display.height / bgAspectY;
    const bgScale = Math.min(bgScaleX, bgScaleY);
    const bgWidth = bgAspectX * bgScale;
    const insetX = (this.display.width - bgWidth) / 2;
    document.documentElement.style.setProperty("--combat-ui-inset-x", `${insetX}px`);
  }

  updateLayout(isResize: boolean = true) {
    if (isResize) {
      this.updateDisplay();
    }

    this.updateDeck(isResize);
    this.updateCardHand(isResize);
    this.updateSelectionSlots(isResize);
    this.updatePlayer();
    this.updateEnemy();
  }

  updateDeck(isResize: boolean = true) {
    const display = this.display;
    const deck = this.cardManager.cardDeck.getDeck();
    const deckLayout = this.layout.cards.deck;
    const targetX = display.centerX + deckLayout.xFromCenter * display.scale;
    const targetY = display.height + deckLayout.yFromBottom * display.scale;
    const angle = 0;

    deck.forEach((card: CardBase) => {
      card.setData({
        [TransformInLayout.X]: targetX,
        [TransformInLayout.Y]: targetY,
        [TransformInLayout.ANGLE]: angle,
        [TransformInLayout.SCALE]: display.scale,
      });
      if (isResize) {
        this.setCardPosition(card);
      } else {
        this.events.emit(LayoutEvents.SET_CARD_POS, card);
      }
    });

    const cover = this.cardManager.cardDeck.getCover();
    cover.setData({
      [TransformInLayout.X]: targetX,
      [TransformInLayout.Y]: targetY,
      [TransformInLayout.ANGLE]: angle,
      [TransformInLayout.SCALE]: display.scale,
    });
    if (isResize) {
      this.setCardPosition(cover);
    } else {
      this.events.emit(LayoutEvents.SET_CARD_POS, cover);
    }
  }

  updateCardHand(isResize: boolean = true) {
    const handCards = this.cardManager.cardHand.getHandCards().getAll() as CardBase[];
    const totalCards = handCards.length;
    if (!totalCards) {
      return;
    }
    const display = this.display;
    const handLayout = this.layout.cards.hand;
    const ground = display.height + handLayout.yFromBottom * display.scale;
    const cardSpace = Math.min(100 * display.scale, (handLayout.width * display.scale) / totalCards);
    const totalHandWidth = cardSpace * (totalCards - 1);
    const startX = this.display.centerX - totalHandWidth / 2;

    handCards.forEach((card: CardBase, index: number) => {
      const targetX = startX + index * cardSpace;
      const offsetFromCenter = (index - (totalCards - 1) / 2) / (totalCards / 2);
      const curveY = Math.pow(offsetFromCenter, 2) * 30 * this.display.scale;
      const targetY = ground + curveY;
      const targetAngle = offsetFromCenter * 10;
      card.setData({
        [TransformInLayout.X]: targetX,
        [TransformInLayout.Y]: targetY,
        [TransformInLayout.ANGLE]: targetAngle,
        [TransformInLayout.SCALE]: this.display.scale,
      });
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

  updateSelectionSlots(isResize: boolean = true) {
    const selectionSlots = this.cardManager.cardSelection.getSelectionSlots();
    const display = this.display;
    const selectionLayout = this.layout.cards.selection;
    const targetX = display.centerX + selectionLayout.startXFromCenter * display.scale;
    const targetY = selectionLayout.yFromTop * display.scale;
    const gridOptions: Phaser.Types.Actions.GridAlignConfig = {
      width: -1,
      cellWidth: selectionLayout.cellWidth * display.scale,
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

  updatePlayer() {
    const display = this.display;
    const playerLayout = this.layout.player;
    const targetX = display.centerX + playerLayout.xFromCenter * display.scale;
    const targetY = display.centerY + playerLayout.yFromCenter * display.scale;
    this.player.setData({
      [TransformInLayout.X]: targetX,
      [TransformInLayout.Y]: targetY,
      [TransformInLayout.SCALE]: this.display.scale,
    });
    this.events.emit(LayoutEvents.SET_COMBATANT_POS, this.player);
  }

  updateEnemy() {
    const display = this.display;
    const enemyLayout = this.layout.enemy;
    const targetX = display.centerX + enemyLayout.xFromCenter * display.scale;
    const targetY = display.centerY + enemyLayout.yFromCenter * display.scale;
    this.enemy.setData({
      [TransformInLayout.X]: targetX,
      [TransformInLayout.Y]: targetY,
      [TransformInLayout.SCALE]: this.display.scale,
    });
    this.events.emit(LayoutEvents.SET_COMBATANT_POS, this.enemy);
  }

  setCardPosition(card: CardBase) {
    const x = card.getData(TransformInLayout.X);
    const y = card.getData(TransformInLayout.Y);
    const angle = card.getData(TransformInLayout.ANGLE);
    const scale = card.getData(TransformInLayout.SCALE);

    card.setPosition(x, y);
    card.angle = angle;
    card.scale = scale;
  }

  setCardToSlot(slot: CardSlot) {
    const card = slot.getCard()!;
    const x = slot.x;
    const y = slot.y;
    const angle = 0;
    const scale = card.getData(TransformInLayout.SCALE) * 0.7;

    card.setPosition(x, y);
    card.angle = angle;
    card.scale = scale;
  }

  setCombatantPositions(combatant: CombatPlayer | CombatEnemy) {
    const targetX = combatant.getData(TransformInLayout.X);
    const targetY = combatant.getData(TransformInLayout.Y);
    const scale = combatant.getData(TransformInLayout.SCALE);
    combatant.setPosition(targetX, targetY);
    combatant.scale = scale;
  }
}
