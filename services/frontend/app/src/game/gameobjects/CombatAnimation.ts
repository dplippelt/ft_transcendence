import Phaser, { Geom, Scene } from "phaser";
import CardManager from "./cards/CardManager";
import CombatPlayer from "./CombatPlayer";
import CombatEnemy from "./CombatEnemy";
import { CardActionEvents } from "./cards/CardManager";
import CardBase from "./cards/CardBase";
import { CardEvents } from "./cards/CardBase";
import CardSlot from "./cards/CardSlot";
import { AssetsKey } from "../Assets";
import CombatManager, { CombatEvents } from "./CombatManager";
import type CombatLayoutManager from "./CombatLayoutManager";
import { TransformInLayout, LayoutEvents } from "./CombatLayoutManager";
import type CombatTurnManager from "./CombatTurnManager";
import { ExecuteCombo } from "./CombatExecuteManager";

enum PlayerAnimation {
  IDLE = "idle",
  ATTACK_A = "attack_A",
  ATTACK_B = "attack_B",
  ATTACK_C = "attack_C",
  GUARD_START = "guard_start",
  GUARD = "guard",
  GUARD_END = "guard_end",
  GET_HIT = "get_hit",
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
    frameRate: 10,
    repeat: 5,
  },
  [PlayerAnimation.GUARD_END]: {
    start: 0,
    end: 3,
    frameRate: 10,
    repeat: 0,
  },
  [PlayerAnimation.GET_HIT]: {
    start: 0,
    end: 4,
    frameRate: 20,
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

interface BattleAnimTween {
  duration: number;
  diffX: number;
  yoyo: boolean;
  repeat: number;
}

const attackAnimation: Record<string, BattleAnimTween> = {
  damageEnemy: {
    duration: 50,
    diffX: 50,
    yoyo: true,
    repeat: 2,
  },
  enemyAttack: {
    duration: 50,
    diffX: 50,
    yoyo: true,
    repeat: 0,
  },
  damagePlayer: {
    duration: 50,
    diffX: 50,
    yoyo: true,
    repeat: 0,
  },
};

export default class CombatAnimation {
  private readonly combatLayoutManager: CombatLayoutManager;
  private readonly scene: Scene;
  private readonly combatManager: CombatManager;
  private readonly cardManager: CardManager;
  private readonly turnManger: CombatTurnManager;
  private readonly player: CombatPlayer;
  private readonly enemy: CombatEnemy;

  constructor(combatLayoutManager: CombatLayoutManager) {
    this.combatLayoutManager = combatLayoutManager;
    this.combatManager = this.combatLayoutManager.combatManger;
    this.scene = this.combatLayoutManager.scene;
    this.cardManager = this.combatLayoutManager.cardManager;
    this.turnManger = this.combatManager.turnManager;
    this.player = this.combatLayoutManager.player;
    this.enemy = this.combatLayoutManager.enemy;
    this.onCardAnimation();
    this.onCombatAnimation();
    this.onLayoutAnimation();
    this.registerPlayerAnimation();
    this.player.play(PlayerAnimation.IDLE);
    this.registerEnemyAnimation();
    this.enemy.play(EnemyAnimation.WALK);
  }

  onCardAnimation() {
    const events = this.cardManager.events;
    events.off(CardActionEvents.DRAW);
    events.on(CardActionEvents.DRAW, this.draw, this);
    events.off(CardActionEvents.SELECT);
    events.on(CardActionEvents.SELECT, this.setCardToSlot, this);
    events.off(CardActionEvents.UNSELECT);
    events.on(CardActionEvents.UNSELECT, this.setCardPosition, this);
  }

  onCombatAnimation() {
    const events = this.combatManager.events;
    events.off(CombatEvents.PLAYERATTACK);
    events.on(CombatEvents.PLAYERATTACK, this.playerAttack, this);
    events.off(CombatEvents.PLAYERGUARD);
    events.on(CombatEvents.PLAYERGUARD, this.playerGuard, this);
    events.off(CombatEvents.ENEMYATTACK);
    events.on(CombatEvents.ENEMYATTACK, this.enemyAttack, this);
  }

  onLayoutAnimation() {
    const events = this.combatLayoutManager.events;
    events.off(LayoutEvents.SET_CARD_TO_SLOT);
    events.on(LayoutEvents.SET_CARD_TO_SLOT, this.setCardToSlot, this);
    events.off(LayoutEvents.SET_CARD_POS);
    events.on(LayoutEvents.SET_CARD_POS, this.setCardPosition, this);
  }

  setCardPosition(card: CardBase) {
    this.scene.tweens.add({
      targets: card,
      x: card.getData(TransformInLayout.X),
      y: card.getData(TransformInLayout.Y),
      angle: card.getData(TransformInLayout.ANGLE),
      // scaleX: scale,
      // scaleY: scale,
      displayWidth: card.width,
      displayHeight: card.height,
      duration: 300,
      ease: "Power2",
    });
  }

  setCardToSlot(slot: CardSlot) {
    const card = slot.getCard()!;
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

  draw(card: CardBase) {
    card.on(CardEvents.FOCUSON, this.HoverUp, this);
    card.on(CardEvents.FOCUSOFF, this.HoverDown, this);
    this.combatLayoutManager.updateCardHand(false);
  }

  HoverUp(card: CardBase) {
    // Needs to fix hard cord.
    if (card.input?.hitArea instanceof Geom.Rectangle) {
      card.input.hitArea.right += 0;
      card.input.hitArea.bottom += 30;
    }
    this.scene.tweens.add({
      targets: card,
      y: card.getData(TransformInLayout.Y) - 30,
      angle: 0,
      duration: 50,
      ease: "Cubic.easeOut",
    });
  }

  HoverDown(card: CardBase) {
    if (card.input?.hitArea instanceof Geom.Rectangle) {
      card.input.hitArea.right -= 0;
      card.input.hitArea.bottom -= 30;
    }
    // Needs to fix hard cord.
    this.scene.tweens.add({
      targets: card,
      y: card.getData(TransformInLayout.Y),
      angle: card.getData(TransformInLayout.ANGLE),
      duration: 200,
      ease: "Power1",
    });
  }

  playerAttack() {
    this.turnManger.pausePlayerTurn();
    const execute = this.combatManager.executeManager;
    switch (execute.getCombo()) {
      case ExecuteCombo.ONE:
        this.player.play(PlayerAnimation.ATTACK_A);
        break;
      case ExecuteCombo.TWO:
        this.player.play(PlayerAnimation.ATTACK_B);
        break;
      case ExecuteCombo.THREE:
        this.player.play(PlayerAnimation.ATTACK_C);
        break;
      default:
        throw Error("Execution combo animation is not implemented.");
    }
    this.player.once("animationcomplete", () => {
      this.enemyTakeDamage();
    });
  }

  playerGuard() {
    this.player.play(PlayerAnimation.GUARD_START);
    this.player.playAfterRepeat(PlayerAnimation.GUARD);
    this.player.once("animationcomplete", () => {
      this.enemyAttackBefore(() => {
        this.player.play(PlayerAnimation.GUARD_END);
        this.player.playAfterRepeat(PlayerAnimation.IDLE);
        this.combatManager.events.emit(CombatEvents.ENDTURN);
      });
    });
  }

  enemyAttack() {
    this.enemyAttackBefore(() => {
      this.playerTakeDamage();
    });
  }

  enemyTakeDamage() {
    this.scene.tweens.add({
      targets: this.enemy,
      x: this.enemy.x + 50,
      duration: 50,
      yoyo: true,
      repeat: 2,
      onStart: () => {
        this.enemy.setTint(0xff0000);
      },
      onComplete: () => {
        this.enemy.clearTint();
        this.combatManager.events.emit(CombatEvents.TAKEDAMAGE, this.enemy);
      },
    });
  }

  enemyAttackBefore(fn: Phaser.Types.Tweens.TweenOnCompleteCallback) {
    this.scene.tweens.add({
      targets: this.enemy,
      x: this.enemy.x - 50,
      delay: 500,
      duration: 50,
      yoyo: true,
      onComplete: fn,
    });
  }

  playerTakeDamage() {
    this.scene.tweens.add({
      targets: this.player,
      duration: 50,
      x: this.player.x - 50,
      yoyo: true,
      onStart: () => {
        this.player.setTint(0xff0000);
        this.player.play(PlayerAnimation.GET_HIT);
        this.scene.cameras.main.shake(500, 0.01);
      },
      onComplete: () => {
        this.player.clearTint();
        this.player.playAfterRepeat(PlayerAnimation.IDLE);
        this.combatManager.events.emit(CombatEvents.TAKEDAMAGE, this.player);
      },
    });
  }

  registerPlayerAnimation() {
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
  }

  registerEnemyAnimation() {
    const anims = this.enemy.anims;
    for (const animKey of Object.values(EnemyAnimation)) {
      anims.create({
        key: animKey,
        frames: anims.generateFrameNumbers(AssetsKey.CombatEnemy),
        frameRate: enemyAnimationFram[animKey].frameRate,
        repeat: enemyAnimationFram[animKey].repeat,
      });
    }
  }
}
