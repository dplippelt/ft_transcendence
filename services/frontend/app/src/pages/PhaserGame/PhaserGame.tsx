import { useEffect, useLayoutEffect, useRef, useState } from "react";
import StartGame from "../../game/main";
import { EventBus } from "../../game/EventBus";
import { useLocation, useNavigate } from "react-router-dom";
import { CombatEvent, GameEvent, GameResult, RoutePath } from "../../utils/utils";
import styles from "./PhaserGame.module.scss";
import { useAuth } from "../../contexts/AuthContext";
import GameUI from "../../components/Game/GameUI";
import CombatUI from "../../components/Game/CombatUI";
import GameBackground from "../../components/Game/GameBackground";

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
  const { auth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isGameURL = location.pathname === RoutePath.gameDev;
  const [gameMenuVis, setGameMenuVis] = useState<boolean>(false);
  const [inCombat, setInCombat] = useState<boolean>(false);
  const gameRef = useRef<Phaser.Game | null>(null!);
  const loggedIn = auth.status === "authenticated";

  useEffect(() =>
  {
    EventBus.emit(GameEvent.gameVis, isGameURL);

    function preserveGame() : boolean {
      switch ( location.pathname )
      {
        case RoutePath.gameDev:
          return true;
        case RoutePath.friends:
          return true;
        case RoutePath.profile:
          return true;
        case RoutePath.leaderboard:
          return true;
        case RoutePath.howToPlay:
          return true;
        case RoutePath.settings:
          return true;
        default:
          return false;
      }
    }

    function cleanupGame() {
      gameRef.current!.destroy(true);
      gameRef.current = null;
      EventBus.removeListener(GameEvent.gameVis);
      EventBus.removeListener(GameEvent.chatFocus);
      EventBus.removeListener(GameEvent.gameMenu);
      EventBus.removeListener(GameEvent.inCombat);
      EventBus.removeListener(GameEvent.gameOver);
      EventBus.removeListener(CombatEvent.initPlayerHP);
      EventBus.removeListener(CombatEvent.updatePlayerHP);
      EventBus.removeListener(CombatEvent.initEnemyHP);
      EventBus.removeListener(CombatEvent.updateEnemyHP);
      EventBus.removeListener(CombatEvent.initPlayerMP);
      EventBus.removeListener(CombatEvent.updatePlayerMP);
      EventBus.removeListener(CombatEvent.initTurnTimer);
      EventBus.removeListener(CombatEvent.attack);
      EventBus.removeListener(CombatEvent.draw);
      EventBus.removeListener(CombatEvent.reset);
      EventBus.removeListener(CombatEvent.turnEnded);
      setGameMenuVis(false);
      setInCombat(false);
    }

    if ( gameRef.current && !preserveGame() )
      cleanupGame();

    if ( !isGameURL )
      return;

    function toggleGameMenu() { setGameMenuVis(prev => !prev); }
    EventBus.addListener(GameEvent.gameMenu, toggleGameMenu);

    function updateInCombat( inCombat: boolean ) { setInCombat(inCombat); }
    EventBus.addListener(GameEvent.inCombat, updateInCombat);

    function gameOver( result: GameResult ) { navigate(RoutePath.gameOver + "/" + result); }
    EventBus.addListener(GameEvent.gameOver, gameOver);

    function cleanup() {
      EventBus.removeListener(GameEvent.gameMenu, toggleGameMenu);
      EventBus.removeListener(GameEvent.inCombat, updateInCombat);
      EventBus.removeListener(GameEvent.gameOver, gameOver);
    }

    return () => cleanup();
  }, [location.pathname, isGameURL])

  return (
    <div className={`${styles.gameWrapper} ${ isGameURL ? "" : styles.hidden }`}>
      <GameBackground inCombat={inCombat} />
      <Game currentActiveScene={currentActiveScene} gameRef={gameRef} isGameURL={isGameURL} />
      <CombatUI inCombat={inCombat} />
      <GameUI gameMenuVis={gameMenuVis} loggedIn={loggedIn} />
    </div>
  );
}
