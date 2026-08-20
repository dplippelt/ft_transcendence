import { Geom, type Scene } from "phaser";
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
import { LayoutData } from "./CombatLayoutManager";
import type CombatTurnManager from "./CombatTurnManager";

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
    this.registerPlayerAnimation();
    this.player.play(PlayerAnimation.IDLE);
    this.registerEnemyAnimation();
    this.enemy.play(EnemyAnimation.WALK);
  }

  onCardAnimation() {
    this.cardManager.events.on(CardActionEvents.DRAW, this.draw, this);
    this.cardManager.events.on(CardActionEvents.SELECT, this.select, this);
    this.cardManager.events.on(CardActionEvents.UNSELECT, this.unselect, this);
  }

  onCombatAnimation() {
    this.combatManager.events.off(CombatEvents.PLAYERATTACK);
    this.combatManager.events.on(CombatEvents.PLAYERATTACK, this.playerAttack, this);
    this.combatManager.events.off(CombatEvents.ENEMYATTACK);
    this.combatManager.events.on(CombatEvents.ENEMYATTACK, this.enemyAttack, this);
  }

  draw(card: CardBase) {
    card.on(CardEvents.FOCUSON, this.HoverUp, this);
    card.on(CardEvents.FOCUSOFF, this.HoverDown, this);
    this.combatLayoutManager.align();
  }

  HoverUp(card: CardBase) {
    // Needs to fix hard cord.
    if (card.input?.hitArea instanceof Geom.Rectangle) {
      card.input.hitArea.right += 0;
      card.input.hitArea.bottom += 30;
    }
    this.scene.tweens.add({
      targets: card,
      y: card.getData(LayoutData.Y) - 30,
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
      y: card.getData(LayoutData.Y),
      angle: card.getData(LayoutData.ANGLE),
      duration: 200,
      ease: "Power1",
    });
  }

  select(card: CardBase, slot: CardSlot) {
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

  unselect(card: CardBase, slot: CardSlot) {
    this.scene.tweens.add({
      targets: card,
      x: card.getData(LayoutData.X),
      y: card.getData(LayoutData.Y),
      angle: card.getData(LayoutData.ANGLE),
      displayWidth: card.width,
      displayHeight: card.height,
      ease: "Cubic.easeOut",
      duration: 300,
    });
  }

  playerAttack(player: CombatPlayer, enemy: CombatEnemy, points: number) {
    this.turnManger.pausePlayerTimer();
    player.play(PlayerAnimation.ATTACK_B);
    player.once("animationcomplete", () => {
      this.scene.tweens.add({
        targets: enemy,
        x: enemy.x + 50,
        duration: 50,
        yoyo: true,
        repeat: 2,
        onStart: () => {
          enemy.setTint(0xff0000);
        },
        onComplete: () => {
          enemy.clearTint();
          this.combatManager.events.emit(CombatEvents.TAKEDAMAGE, enemy, points);
        },
      });
    });
  }

  enemyAttack(enemy: CombatEnemy, player: CombatPlayer, points: number) {
    this.scene.tweens.add({
      targets: enemy,
      x: enemy.x - 50,
      duration: 50,
      yoyo: true,
      onComplete: () => {
        this.scene.tweens.add({
          targets: player,
          duration: 50,
          x: player.x - 50,
          yoyo: true,
          onStart: () => {
            player.setTint(0xff0000);
            this.scene.cameras.main.shake(500, 0.01);
          },
          onComplete: () => {
            player.clearTint();
            this.combatManager.events.emit(CombatEvents.TAKEDAMAGE, player, points);
            player.playAfterRepeat(PlayerAnimation.IDLE);
          },
        });
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
