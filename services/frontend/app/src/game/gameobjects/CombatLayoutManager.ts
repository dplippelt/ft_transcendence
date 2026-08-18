import Phaser, { Actions, Geom, Scene } from "phaser";
import CombatManager, { CombatAnimEvents } from "./CombatManager";
import type CardBase from "./cards/CardBase";
import type CardManager from "./cards/CardManager";
import CombatPlayer from "./CombatPlayer";
import type CombatEnemy from "./CombatEnemy";
import { CardActionEvents } from "./cards/CardManager";
import { CardEvents } from "./cards/CardBase";
import type CardSlot from "./cards/CardSlot";
import { AssetsKey } from "../Assets";

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

interface CombatLayoutBase {
  width: number;
  height: number;
}

const combatLayoutBase: CombatLayoutBase = {
  width: 1280,
  height: 780,
};

enum PlayerAnimation {
  IDLE = "idle",
  ATTACK_A = "attack_A",
  ATTACK_B = "attack_B",
  ATTACK_C = "attack_C",
  GUARD_START = "guard_start",
  GUARD = "guard",
  GUARD_END = "guard_end",
}

interface AtlasFrame {
  start: number;
  end: number;
  frameRate: number;
  repeat: number;
}

interface AtlasFrameName {
  prefixAfterKey: string;
  zeroPad: number;
}

const playerAnimationFrames: Record<PlayerAnimation, AtlasFrame> = {
  [PlayerAnimation.IDLE]: {
    start: 0,
    end: 5,
    frameRate: 8,
    repeat: -1,
  },
  [PlayerAnimation.ATTACK_A]: {
    start: 0,
    end: 13,
    frameRate: 30,
    repeat: 0,
  },
  [PlayerAnimation.ATTACK_B]: {
    start: 0,
    end: 12,
    frameRate: 30,
    repeat: 0,
  },
  [PlayerAnimation.ATTACK_C]: {
    start: 0,
    end: 13,
    frameRate: 30,
    repeat: 0,
  },
  [PlayerAnimation.GUARD_START]: {
    start: 0,
    end: 3,
    frameRate: 8,
    repeat: 0,
  },
  [PlayerAnimation.GUARD]: {
    start: 0,
    end: 5,
    frameRate: 8,
    repeat: 2,
  },
  [PlayerAnimation.GUARD_END]: {
    start: 0,
    end: 3,
    frameRate: 8,
    repeat: 0,
  },
};

const playerAnimationFrameName: AtlasFrameName = {
  prefixAfterKey: "frame",
  zeroPad: 4,
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
    this.cardManager.events.on(CardActionEvents.DRAW, this.drawAnim, this);
    this.cardManager.events.on(CardActionEvents.SELECT, this.selectAnim, this);
    this.cardManager.events.on(CardActionEvents.UNSELECT, this.unselectAnim, this);
    this.player = this.combatManger.player;
    this.registerPlayerAnimation(this.player);
    this.enemy = this.combatManger.enemy;
    this.registerEnemyAnimation(this.enemy);
    this.enemy.on(CombatAnimEvents.ATTACK, this.attack, this);
    this.enemy.on(CombatAnimEvents.TAKEDAMAGE, this.takeDamage, this);
    this.scene = combatManger.scene;
    this.layoutFromCenter = layoutFromCenter;
    this.layoutBase = combatLayoutBase;
    this.align();
    this.scene.scale.on("resize", () => {
      this.align();
    });
  }

  registerPlayerAnimation(player: CombatPlayer) {
    for (const animKey of Object.values(PlayerAnimation)) {
      player.anims.create({
        key: animKey,
        frames: player.anims.generateFrameNames(AssetsKey.CombatPlayer, {
          prefix: `${animKey}/${playerAnimationFrameName.prefixAfterKey}`,
          start: playerAnimationFrames[animKey].start,
          end: playerAnimationFrames[animKey].end,
          zeroPad: playerAnimationFrameName.zeroPad,
        }),
        frameRate: playerAnimationFrames[animKey].frameRate,
        repeat: playerAnimationFrames[animKey].repeat,
      });
    }
    player.on(CombatAnimEvents.ATTACK, this.attack, this);
    player.on(CombatAnimEvents.TAKEDAMAGE, this.takeDamage, this);
    player.play(PlayerAnimation.IDLE);
  }

  registerEnemyAnimation(enemy: CombatEnemy) {
    const anims = enemy.anims;
    anims.create({
      key: "idle",
      frames: anims.generateFrameNumbers(AssetsKey.CombatEnemy),
      frameRate: 8,
      repeat: -1,
    });
    enemy.play("idle");
  }

  attack(combatant: CombatPlayer | CombatEnemy) {
    if (combatant instanceof CombatPlayer) {
      combatant.play(PlayerAnimation.ATTACK_B);
      combatant.playAfterRepeat(PlayerAnimation.IDLE);
    }
  }

  takeDamage() {}

  drawAnim(card: CardBase) {
    card.on(CardEvents.FOCUSON, this.HoverUpAnim, this);
    card.on(CardEvents.FOCUSOFF, this.HoverDownAnim, this);
    this.align();
  }

  HoverUpAnim(card: CardBase) {
    // Needs to fix hard cord.
    if (card.input?.hitArea instanceof Geom.Rectangle) {
      card.input.hitArea.right += 0;
      card.input.hitArea.bottom += 30;
    }
    this.scene.tweens.add({
      targets: card,
      y: card.offset.y - 30,
      angle: 0,
      duration: 50,
      ease: "Cubic.easeOut",
    });
    console.log(`test 2: offset y = ${card.offset.y}, y = ${card.y}`);
  }

  HoverDownAnim(card: CardBase) {
    if (card.input?.hitArea instanceof Geom.Rectangle) {
      card.input.hitArea.right -= 0;
      card.input.hitArea.bottom -= 30;
    }
    // Needs to fix hard cord.
    this.scene.tweens.add({
      targets: card,
      y: card.offset.y,
      angle: card.offset.angle,
      duration: 200,
      ease: "Power1",
    });
  }

  selectAnim(card: CardBase, slot: CardSlot) {
    // Needs to fix hard cord.
    this.scene.tweens.add({
      targets: card,
      x: slot.x,
      y: slot.y,
      angle: 0,
      displayWidth: card.width * 0.7,
      displayHeight: card.height * 0.7,
      ease: "Cubic.easeOut",
      duration: 200,
    });
  }

  unselectAnim(card: CardBase, slot: CardSlot) {
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

    deck.forEach((card: CardBase) => {
      card.setPosition(centerX + diff.x * scale, centerY + diff.y * scale);
      card.setOffset(card.x, card.y);
    });

    const cover = this.cardManager.cardDeck.getCover();
    cover.setPosition(centerX + diff.x * scale, centerY + diff.y * scale);
    cover.setOffset(cover.x, cover.y);
  }

  alignCardHand(centerX: number, centerY: number, scale: number) {
    const handCards = this.cardManager.cardHand.getHandCards().getAll("isSelected", false) as CardBase[];
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
      card.offset.x = targetX;
      card.offset.y = targetY;
      card.offset.angle = targetAngle;
      this.scene.tweens.add({
        targets: card,
        x: targetX,
        y: targetY,
        angle: targetAngle,
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
