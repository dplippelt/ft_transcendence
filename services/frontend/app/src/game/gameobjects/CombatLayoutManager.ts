import Phaser, { Actions, Scene } from "phaser";
import CombatManager from "./CombatManager";
import type CardBase from "./cards/CardBase";
import type CardManager from "./cards/CardManager";
import CombatPlayer from "./CombatPlayer";
import type CombatEnemy from "./CombatEnemy";
import CombatAnimation from "./CombatAnimation";
import { CardActionEvents } from "./cards/CardManager";
import type CardSlot from "./cards/CardSlot";

// Must match the dimensions of the background image used in 'GameBackground.module.scss'
const BG_WIDTH = 1774;
const BG_HEIGHT = 887;

interface Display {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  scale: number;
}

interface Background {
  scale: number;
  topY: number;
  bottomY: number;
}

interface Size {
  width: number;
  height: number;
}

interface SpriteSize {
  card: Size;
  player: Size;
  enemy: Size;
}

interface CombatLayout {
  width: number;
  height: number;
  player: {
    xFromCenter: number;
    yFromBgBottom: number;
    scale: number;
  };
  enemy: {
    xFromCenter: number;
    yFromBgBottom: number;
    scale: number;
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
      cellGap: number;
      cellScale: number;
      yFromBgTop: number;
    };
    deck: {
      xFromLeftPerc: number;
      yFromTopPerc: number;
    };
  };
}

const spriteSize: SpriteSize = {
  card: {
    width: 64,
    height: 96,
  },
  player: {
    width: 79,
    height: 63,
  },
  enemy: {
    width: 37,
    height: 43,
  },
}

const combatLayout: CombatLayout = {
  width: 960,
  height: 540,
  player: {
    xFromCenter: -220,
    yFromBgBottom: -200,
    scale: 1.8,
  },
  enemy: {
    xFromCenter: 220 + 0.5 * spriteSize.enemy.width,
    yFromBgBottom: -200,
    scale: 1.8,
  },
  cards: {
    hand: {
      width: 500,
      yFromBottom: -50,
    },
    selection: {
      startXFromCenter: -175,
      endXFromCenter: 175,
      cellWidth: spriteSize.card.width,
      cellGap: 10,
      cellScale: 1.3,
      yFromBgTop: 170,
    },
    deck: {
      xFromLeftPerc: 9,
      yFromTopPerc: 69,
    },
  },
};

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
  CLEAR_HAND = "clearHandCards",
}

export default class CombatLayoutManager {
  readonly combatManger: CombatManager;
  readonly scene: Scene;
  readonly cardManager: CardManager;
  readonly player: CombatPlayer;
  readonly enemy: CombatEnemy;
  readonly events: Phaser.Events.EventEmitter;
  readonly anims: CombatAnimation;
  readonly spriteSize: SpriteSize;
  readonly layout: CombatLayout;
  readonly display!: Display;
  readonly background!: Background;

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
    this.spriteSize = spriteSize;
    this.layout = combatLayout;
    this.display = { width: 0, height: 0, centerX: 0, centerY: 0, scale: 0 };
    this.background = { scale: 0, topY: 0, bottomY: 0 };
    this.scene.scale.refresh();
    this.updateDisplay();
    this.updateLayout();
    this.scene.scale.on("resize", this.updateLayout, this);
  }

  onCardActions() {
    this.cardManager.events.on(CardActionEvents.SELECT, () => this.updateSelectionSlots(false), this);
    this.cardManager.events.on(CardActionEvents.UNSELECT, () => this.updateSelectionSlots(false), this);
    this.cardManager.events.on(CardActionEvents.GENERATE_DECK, this.updateDeck, this);
    this.cardManager.events.on(CardActionEvents.CLEAR_HAND, this.clearHand, this);
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

    // Calculating the horizontal and vertical inset to compensate for
    // letterboxing around the background image with regard to the Combat UI
    // and calculating background scale and bottom/top Y for player, enemey
    // and selected cards sprite positioning
    const bgScaleX = this.display.width / BG_WIDTH;
    const bgScaleY = this.display.height / BG_HEIGHT;
    const bgScale = Math.min(bgScaleX, bgScaleY);
    const bgWidth = BG_WIDTH * bgScale;
    const bgHeight = BG_HEIGHT * bgScale;
    const insetX = (this.display.width - bgWidth) / 2;
    const insetY = (this.display.height - bgHeight) / 2;

    this.background.scale = bgScale;
    this.background.bottomY = this.display.height - insetY;
    this.background.topY = insetY;

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
    const insetX = parseFloat(document.documentElement.style.getPropertyValue("--combat-ui-inset-x"));
    const deck = this.cardManager.cardDeck.getDeck();
    const deckLayout = this.layout.cards.deck;
    const targetX = (deckLayout.xFromLeftPerc / 100) * display.width + insetX;
    const targetY = (deckLayout.yFromTopPerc / 100) * display.height;
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

    // Making cards in deck and cover card invisible in favor of
    // a new deck image used for the React button
    deck.forEach((card) => card.setVisible(false));
    cover.setVisible(false);

    // Setting deck position and size as properties so React can
    // render an invisible button of the same size on top of it
    document.documentElement.style.setProperty("--deck-x", `${targetX}px`);
    document.documentElement.style.setProperty("--deck-y", `${targetY}px`);
    document.documentElement.style.setProperty("--deck-width", `${this.spriteSize.card.width * display.scale}px`);
    document.documentElement.style.setProperty("--deck-height", `${this.spriteSize.card.height * display.scale}px`);
  }

  updateCardHand(isResize: boolean = true) {
    const handCards = this.cardManager.cardHand.getHandCards().getAll() as CardBase[];
    handCards.forEach((card) => card.setVisible(true)); // need to be made visible again as they were made invisible in the deck
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
        this.events.emit(LayoutEvents.SET_CARD_POS, card, 400);
      }
    });
  }

  updateSelectionSlots(isResize: boolean = true) {
    const selectionSlots = this.cardManager.cardSelection.getSelectionSlots();
    const occupiedSlots = selectionSlots.filter((slot) => slot.isCardSet());
    const display = this.display;
    const background = this.background;
    const selectionLayout = this.layout.cards.selection;
    const cellWidth = ((this.spriteSize.card.width * selectionLayout.cellScale) + selectionLayout.cellGap) * background.scale;
    const targetX = display.centerX - ((occupiedSlots.length - 1) / 2) * cellWidth;
    const targetY = background.topY + selectionLayout.yFromBgTop * background.scale;
    const gridOptions: Phaser.Types.Actions.GridAlignConfig = {
      width: -1,
      cellWidth: cellWidth,
      x: targetX,
      y: targetY,
    };

    Actions.GridAlign(occupiedSlots, gridOptions);

    for (const slot of occupiedSlots) {
      if (isResize) {
        this.setCardToSlot(slot);
      } else {
        this.events.emit(LayoutEvents.SET_CARD_TO_SLOT, slot);
      }
    }
  }

  updatePlayer() {
    const display = this.display;
    const background = this.background;
    const playerLayout = this.layout.player;
    const targetX = display.centerX + playerLayout.xFromCenter * display.scale;
    const targetY = background.bottomY + playerLayout.yFromBgBottom * background.scale;
    this.player.setData({
      [TransformInLayout.X]: targetX,
      [TransformInLayout.Y]: targetY,
      [TransformInLayout.SCALE]: this.display.scale * playerLayout.scale,
    });
    this.events.emit(LayoutEvents.SET_COMBATANT_POS, this.player);
  }

  updateEnemy() {
    const display = this.display;
    const background = this.background;
    const enemyLayout = this.layout.enemy;
    const targetX = display.centerX + enemyLayout.xFromCenter * display.scale;
    const targetY = background.bottomY + enemyLayout.yFromBgBottom * background.scale;
    this.enemy.setData({
      [TransformInLayout.X]: targetX,
      [TransformInLayout.Y]: targetY,
      [TransformInLayout.SCALE]: this.display.scale * enemyLayout.scale,
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
    const bgScale = this.background.scale;
    const cellScale = this.layout.cards.selection.cellScale;
    const x = slot.x;
    const y = slot.y;
    const angle = 0;
    const scale = bgScale * cellScale;

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

  clearHand(cards: CardBase[]) {
    const targetX = this.display.centerX;
    const targetY = this.display.height + spriteSize.card.height;
    const targetAngle = 0;

    for ( const card of cards ) {
      card.setData({
        [TransformInLayout.X]: targetX,
        [TransformInLayout.Y]: targetY,
        [TransformInLayout.ANGLE]: targetAngle,
        [TransformInLayout.SCALE]: this.display.scale,
      });
    }
    this.events.emit(LayoutEvents.CLEAR_HAND, cards);
  }
}
