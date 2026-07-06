import Phaser, { Types, Game, Scene } from "phaser";

export interface IRefPhaserGame<SceneType extends Scene> {
  game: Game;
  scene: SceneType;
}

function waitForGameReady(game: Phaser.Game): Promise<void> {
  return new Promise<void>((resolve) => {
    if (game.isBooted) {
      resolve();
    } else {
      game.events.once(Phaser.Core.Events.READY, resolve);
    }
  });
}

function waitForSceneReady(scene: Phaser.Scene): Promise<void> {
  return new Promise<void>((resolve) => {
    if (scene.sys.settings.status >= Phaser.Scenes.RUNNING) {
      resolve();
    } else {
      scene.events.once(Phaser.Scenes.Events.CREATE, resolve);
    }
  });
}

function startTestGame(
  scene: Types.Scenes.SceneType | Types.Scenes.SceneType[],
): Game {
  const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.HEADLESS,
    width: 800,
    height: 600,
    pixelArt: true,
    customEnvironment: true,
    loader: {
      path: "./assets",
    },
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

  return new Phaser.Game({ ...gameConfig, scene });
}

export function gameTick<SceneType extends Scene>(gameRef: IRefPhaserGame<SceneType>) {
  gameRef.game.loop.tick();
}

export function destroyGame<SceneType extends Scene>(gameRef: IRefPhaserGame<SceneType>) {
  gameRef.game.loop.stop();
  gameRef.game.loop.tick();
  gameRef.game.destroy(true);
  gameRef.game = undefined!;
  gameRef.scene = undefined!;
}

export async function startAndLoadGame<SceneType extends Scene>(sceneName: string, sceneType: Types.Scenes.SceneType | Types.Scenes.SceneType[]): Promise<IRefPhaserGame<SceneType>> {
  const game = startTestGame(sceneType)
  await waitForGameReady(game);

  const scene = game.scene.getScene(sceneName) as SceneType
  await waitForSceneReady(scene);

  return { game, scene };
}
