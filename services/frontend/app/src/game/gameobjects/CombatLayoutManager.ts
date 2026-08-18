import Phaser, { Actions, Geom, Scene } from "phaser";
import CombatManager, { CombatAnimEvents } from "./CombatManager";
import type CardBase from "./cards/CardBase";
import type CardManager from "./cards/CardManager";
import CombatPlayer from "./CombatPlayer";
import type CombatEnemy from "./CombatEnemy";
import { CardAnimEvents } from "./cards/CardManager";
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
    start: number,
    end: number,
    frameRate: number,
    repeat: number,
}

interface AtlasFrameName {
    prefixAfterKey: string,
    zeroPad: number,
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
    this.cardManager.events.on(CardAnimEvents.DRAW, this.drawAnim, this);
    this.cardManager.events.on(CardAnimEvents.SELECT, this.selectAnim, this);
    this.cardManager.events.on(CardAnimEvents.UNSELECT, this.unselectAnim, this);
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

    Actions.PlaceOnLine(handCards.getAll(), handLine);
    handCards.iterate((card: CardBase) => {
      card.setOffset(card.x, card.y);
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
