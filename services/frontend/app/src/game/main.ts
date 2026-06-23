import Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import PreloadScene from "./scenes/PreloadScene";
import GameScene from "./scenes/GameScene";
import CombatScene from "./scenes/CombatScene";

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
//   width: window.innerWidth,
//   height: window.innerHeight,
  scale:
  {
	mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  pixelArt: true,
  loader: {
    path: "./assets",
  },
  scene: [BootScene, PreloadScene, GameScene, CombatScene],
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
