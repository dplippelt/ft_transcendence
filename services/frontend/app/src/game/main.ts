import Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import PreloadScene from "./scenes/PreloadScene";
import { GameManagerScene } from "./scenes/GameManagerScene";
import { RegistryKey, type GameURL } from "../utils/utils";
import { MultiGameManagerScene } from "./scenes/MultiGameManagerScene";

export interface StartGameOptions {
  gameURL: GameURL;
  userId?: number;
}

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  disableContextMenu: true,
  transparent: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  pixelArt: true,
  roundPixels: true,
  loader: {
    path: "./assets",
  },
  scene: [BootScene, PreloadScene, GameManagerScene, MultiGameManagerScene],
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
        x: 0,
        y: 0,
      },
    },
  },
};

export default function StartGame(parent: string, opts: StartGameOptions) {
  return new Phaser.Game({
    ...gameConfig,
    parent,
    callbacks: {
      preBoot: (game) => {
        game.registry.set(RegistryKey.gameURL, opts.gameURL);
        game.registry.set(RegistryKey.userId, opts.userId);
      },
    },
  });
}
