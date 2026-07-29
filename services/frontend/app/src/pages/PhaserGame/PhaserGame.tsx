import { useEffect, useLayoutEffect, useRef, useState } from "react";
import StartGame from "../../game/main";
import { EventBus } from "../../game/EventBus";
import Background from "../../components/Background";
import GameMenu from "../../components/GameMenu";
import { useLocation } from "react-router-dom";
import { GameEvent, RoutePath } from "../../utils/utils";
import styles from "./PhaserGame.module.scss";
import SideBar from "../../components/SideBar";

export interface IRefPhaserGame {
  game: Phaser.Game | null;
  scene: Phaser.Scene | null;
}

interface IPhaserGame
{
  currentActiveScene?: (scene_instance: Phaser.Scene) => void;
}

interface IGame {
  currentActiveScene?: (scene_instance: Phaser.Scene) => void;
  gameRef: React.RefObject<Phaser.Game | null>;
  isGameURL: boolean;
}

function Game( { currentActiveScene, gameRef, isGameURL } : IGame )
{
    useLayoutEffect(() => {
      if (isGameURL && gameRef.current === null) {
        gameRef.current = StartGame("game-container");
      }
    }, [gameRef, isGameURL]);

    useEffect(() => {
      EventBus.on("current-scene-ready", (scene_instance: Phaser.Scene) => {
        if (currentActiveScene && typeof currentActiveScene === "function") {
          currentActiveScene(scene_instance);
        }
      });

      return () => {
        EventBus.removeListener("current-scene-ready");
      };
    }, [currentActiveScene]);

    return <div id="game-container" />;
}

/* PhaserGame renders outside of <Routes> so the game instance can survive route
 * changes instead of being unmounted/recreated per-route. isGameURL controls
 * visibility and whether a new game gets created. preserveGame() below decides on
 * whether to destroy the running instance on navigation using an explicit allowlist
 * of routes (Friends, Profile, Leaderboard, etc.) where the game should keep running
 * in the background. */
export default function PhaserGame( { currentActiveScene } : IPhaserGame )
{
  const location = useLocation();
  const isGameURL = location.pathname === RoutePath.gameDev;
  const [gameMenuVis, setGameMenuVis] = useState<boolean>(false);
  const gameRef = useRef<Phaser.Game | null>(null!);

  useEffect(() =>
  {
    EventBus.emit(GameEvent.gameVis, isGameURL);

    function preserveGame() : boolean
    {
      if ( location.pathname === RoutePath.gameDev )
        return true;
      if ( location.pathname === RoutePath.friends )
        return true;
      if ( location.pathname === RoutePath.profile )
        return true;
      if ( location.pathname === RoutePath.leaderboard )
        return true;
      if ( location.pathname === RoutePath.howToPlay )
        return true;
      if ( location.pathname === RoutePath.settings )
        return true;
      return false;
    }

    if ( gameRef.current && !preserveGame() ) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }

    if ( !isGameURL )
      return;

    EventBus.addListener(GameEvent.gameMenu, () => setGameMenuVis(prev => !prev));

    return () => {
      EventBus.removeListener(GameEvent.gameMenu);
    };
  }, [location.pathname, isGameURL])

  return (
    <div className={`${styles.gameWrapper} ${ isGameURL ? "" : styles.hidden }`}>
      <Background />
      <Game currentActiveScene={currentActiveScene} gameRef={gameRef} isGameURL={isGameURL} />
      { gameMenuVis && <GameMenu />}
      <SideBar />
    </div>
  );
}
