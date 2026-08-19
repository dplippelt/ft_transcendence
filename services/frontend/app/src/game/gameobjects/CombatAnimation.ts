import { Geom, type Scene } from "phaser";
import CardManager from "./cards/CardManager";
import CombatPlayer from "./CombatPlayer";
import CombatEnemy from "./CombatEnemy";
import { CardActionEvents } from "./cards/CardManager";
import CardBase from "./cards/CardBase";
import { CardEvents } from "./cards/CardBase";
import CardSlot from "./cards/CardSlot";
import { AssetsKey } from "../Assets";
import { CombatAnimEvents } from "./CombatManager";
import type CombatLayoutManager from "./CombatLayoutManager";

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

enum EnemyAnimation {
  WALK = "walk",
}

interface SpriteSheetFrame {
  frameRate: number;
  repeat: number;
}

const enemyAnimationFram: Record<EnemyAnimation, SpriteSheetFrame> = {
  [EnemyAnimation.WALK]: {
    frameRate: 8,
    repeat: -1,
  },
};

export default class CombatAnimation {
  private readonly combatLayoutManager: CombatLayoutManager;
  private readonly scene: Scene;
  private readonly cardManager: CardManager;
  private readonly player: CombatPlayer;
  private readonly enemy: CombatEnemy;
  //   private readonly isActive: boolean;

  constructor(combatLayoutManager: CombatLayoutManager) {
    this.combatLayoutManager = combatLayoutManager;
    this.scene = this.combatLayoutManager.scene;
    this.cardManager = this.combatLayoutManager.cardManager;
    this.player = this.combatLayoutManager.player;
    this.enemy = this.combatLayoutManager.enemy;
    // this.isActive = false;
    this.registerCardManagerAnim();
    this.registerPlayerAnim();
    this.registerEnemyAnim();
  }

  registerCardManagerAnim() {
    this.cardManager.events.on(CardActionEvents.DRAW, this.drawAnim, this);
    this.cardManager.events.on(CardActionEvents.SELECT, this.selectAnim, this);
    this.cardManager.events.on(CardActionEvents.UNSELECT, this.unselectAnim, this);
  }
  drawAnim(card: CardBase) {
    card.on(CardEvents.FOCUSON, this.HoverUpAnim, this);
    card.on(CardEvents.FOCUSOFF, this.HoverDownAnim, this);
    this.combatLayoutManager.align();
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
    this.combatLayoutManager.align();
  }

  registerPlayerAnim() {
    const anims = this.player.anims;
    for (const animKey of Object.values(PlayerAnimation)) {
      anims.create({
        key: animKey,
        frames: anims.generateFrameNames(AssetsKey.CombatPlayer, {
          prefix: `${animKey}/${playerAnimationFrameName.prefixAfterKey}`,
          start: playerAnimationFrames[animKey].start,
          end: playerAnimationFrames[animKey].end,
          zeroPad: playerAnimationFrameName.zeroPad,
        }),
        frameRate: playerAnimationFrames[animKey].frameRate,
        repeat: playerAnimationFrames[animKey].repeat,
      });
    }
    this.player.on(CombatAnimEvents.ATTACK, this.attack, this);
    this.player.on(CombatAnimEvents.TAKEDAMAGE, this.takeDamage, this);
    this.player.play(PlayerAnimation.IDLE);
  }

  registerEnemyAnim() {
    const anims = this.enemy.anims;
    for (const animKey of Object.values(EnemyAnimation)) {
      anims.create({
        key: animKey,
        frames: anims.generateFrameNumbers(AssetsKey.CombatEnemy),
        frameRate: enemyAnimationFram[animKey].frameRate,
        repeat: enemyAnimationFram[animKey].repeat,
      });
    }
    this.enemy.on(CombatAnimEvents.ATTACK, this.attack, this);
    this.enemy.on(CombatAnimEvents.TAKEDAMAGE, this.takeDamage, this);
    this.enemy.play(EnemyAnimation.WALK);
  }

  attack(combatant: CombatPlayer | CombatEnemy) {
    if (combatant instanceof CombatPlayer) {
      combatant.play(PlayerAnimation.ATTACK_B);
      combatant.playAfterRepeat(PlayerAnimation.IDLE);
    } else {
    }
  }

  takeDamage() {}
}
