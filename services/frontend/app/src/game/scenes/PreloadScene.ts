import Phaser from "phaser";
import { Assets, AssetsKey } from "../Assets";

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super("preload");
  }

  preload() {
    // load game assets
    this.load.spritesheet(AssetsKey.Player, Assets[AssetsKey.Player], {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet(AssetsKey.Skeleton, Assets[AssetsKey.Skeleton], {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet(AssetsKey.TileSet, Assets[AssetsKey.TileSet], {
      frameWidth: 16,
      frameHeight: 16
    });
    this.load.atlas(AssetsKey.CombatPlayer, Assets[AssetsKey.CombatPlayer], Assets[AssetsKey.CombatPlayerJSON]);
    this.load.spritesheet(AssetsKey.CombatEnemy, Assets[AssetsKey.CombatEnemy], {
      frameWidth: 37,
      frameHeight: 45,
    });
    this.load.spritesheet(AssetsKey.Cards, Assets[AssetsKey.Cards], {
      frameWidth: 64,
      frameHeight: 96,
    });
  }

  create() {
    this.scene.start("game-manager");
  }
}
