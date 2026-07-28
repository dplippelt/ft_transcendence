import Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import PreloadScene from "./scenes/PreloadScene";
import { GameManagerScene } from "./scenes/GameManagerScene";

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  disableContextMenu: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  pixelArt: true,
  roundPixels: true,
  loader: {
    path: "./assets",
  },
  scene: [BootScene, PreloadScene, GameManagerScene],
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

export default function StartGame(parent: string) {
  return new Phaser.Game({ ...gameConfig, parent });
}
