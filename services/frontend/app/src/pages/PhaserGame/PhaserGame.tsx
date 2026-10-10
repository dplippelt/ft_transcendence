import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import StartGame from "../../game/main";
import { EventBus } from "../../game/EventBus";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CombatEvent, DEFAULT_OPS_MASK, GameEvent, GameState, GameType, getPathToGame, isValidGameType, isValidOpsMaskStr, parseGameURL as parseGameURLParams, RouteParamKey, RouteParamValue, RoutePath } from "../../utils/utils";
import styles from "./PhaserGame.module.scss";
import { useAuth } from "../../contexts/AuthContext";
import GameUI from "../../components/Game/GameUI";
import CombatUI from "../../components/Game/CombatUI";
import GameBackground from "../../components/Game/GameBackground";
import GameOver from "../../components/Game/GameOver";

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
  canStartGame: boolean;
}

function Game( { currentActiveScene, gameRef, canStartGame } : IGame )
{
    useLayoutEffect(() => {
      if (canStartGame && gameRef.current === null) {
        EventBus.emit(GameEvent.gameState, GameState.default);
        gameRef.current = StartGame("game-container");
      }
    }, [gameRef, canStartGame]);

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
  const [searchParams] = useSearchParams();
  const isGameURL = location.pathname === RoutePath.game;
  const opsMask = searchParams.get(RouteParamKey.ops);
  const gameType = searchParams.get(RouteParamKey.type);
  const isCoop = gameType === RouteParamValue.localCoop;
  const gameURLParams = useMemo(() => parseGameURLParams(opsMask, gameType), [opsMask, gameType]);
  const [gameMenuVis, setGameMenuVis] = useState<boolean>(false);
  const [inCombat, setInCombat] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState>(GameState.default);
  const gameRef = useRef<Phaser.Game | null>(null!);
  const loggedIn = auth.status === "authenticated";
  const isLoggingOutRef = useRef<boolean>(false);

  const cleanupGame = useCallback(() => {
    gameRef.current!.destroy(true);
    gameRef.current = null;
    EventBus.removeListener(GameEvent.gameVis);
    EventBus.removeListener(GameEvent.chatFocus);
    EventBus.removeListener(GameEvent.gameMenu);
    EventBus.removeListener(GameEvent.blur);
    EventBus.removeListener(GameEvent.inCombat);
    EventBus.removeListener(GameEvent.gameState);
    EventBus.removeListener(CombatEvent.initPlayerHP);
    EventBus.removeListener(CombatEvent.updatePlayerHP);
    EventBus.removeListener(CombatEvent.initEnemyHP);
    EventBus.removeListener(CombatEvent.updateEnemyHP);
    EventBus.removeListener(CombatEvent.initPlayerMP);
    EventBus.removeListener(CombatEvent.updatePlayerMP);
    EventBus.removeListener(CombatEvent.initTurn);
    EventBus.removeListener(CombatEvent.getInitPlayerHp);
    EventBus.removeListener(CombatEvent.getInitPlayerMp);
    EventBus.removeListener(CombatEvent.getInitEnemyHp);
    EventBus.removeListener(CombatEvent.getInitTargetNumbers);
    EventBus.removeListener(CombatEvent.getCurrPlayerHp);
    EventBus.removeListener(CombatEvent.getCurrPlayerMp);
    EventBus.removeListener(CombatEvent.getCurrEnemyHp);
    EventBus.removeListener(CombatEvent.getCurrTargetNumbers);
    EventBus.removeListener(CombatEvent.getTurnTimerState);
    EventBus.removeListener(CombatEvent.attack);
    EventBus.removeListener(CombatEvent.draw);
    EventBus.removeListener(CombatEvent.completeFillHand);
    EventBus.removeListener(CombatEvent.turnEnded);
    EventBus.removeListener(CombatEvent.pauseTimer);
    setGameMenuVis(false);
    setInCombat(false);
    setGameState(GameState.default);
    isLoggingOutRef.current = false;
  }, []);

  const redirectToGameUrl = useCallback(( opsMask: string, gameType: GameType ) => {
    const ops = parseInt(opsMask, 2);
    navigate(getPathToGame(ops, gameType), { replace: true });
    if ( gameRef.current )
      cleanupGame();
  }, [navigate, cleanupGame]);

  function checkStartGame() : boolean {
    if ( !isGameURL )
      return false;
    if ( gameURLParams === null )
      return false;
    if ( isCoop && !loggedIn )
      return false;
    return true;
  }

  /* Only create the game once the URL is valid and the requested game type is
   * allowed, so redirects (bad params, coop while logged out) flip this from
   * false to true and the game gets (re)created with the corrected URL. */
  const canStartGame = checkStartGame();

  useEffect(() =>
  {
    function isLoggingOut() { isLoggingOutRef.current = true }
    EventBus.addListener(GameEvent.logout, isLoggingOut);
    return () => { EventBus.removeListener(GameEvent.logout, isLoggingOut) };
  }, []);

  useEffect(() =>
  {
    EventBus.emit(GameEvent.gameVis, isGameURL);

    function preserveGame() : boolean {
      switch ( location.pathname )
      {
        case RoutePath.game:
          return true;
        case RoutePath.friends:
          return true;
        case RoutePath.profile:
          return true;
        case RoutePath.leaderboard:
          return true;
        case RoutePath.howToPlay:
          return true;
        default:
          return false;
      }
    }

    function coopAllowed() : boolean {
      if ( !loggedIn )
        return false;
      if ( isLoggingOutRef.current )
        return false;
      return true
    }

    function navToValidGameUrl() {
      const validGameType = gameType && isValidGameType(gameType)
        ? gameType as GameType
        : GameType.SinglePlayer;

      const validOpsMask = opsMask && isValidOpsMaskStr(opsMask)
        ? opsMask
        : DEFAULT_OPS_MASK;

      redirectToGameUrl(validOpsMask, validGameType);
    }

    if ( gameRef.current && !preserveGame() )
      cleanupGame();

    if ( !isGameURL )
      return;

    if ( !gameURLParams ) {
      navToValidGameUrl();
      return;
    }

    if ( isCoop && auth.status === "loading" )
      return;

    if ( isCoop && !coopAllowed() ) {
      redirectToGameUrl(gameURLParams.opsMask, GameType.SinglePlayer);
      return;
    }

    function toggleGameMenu() { setGameMenuVis(prev => !prev); }
    EventBus.addListener(GameEvent.gameMenu, toggleGameMenu);

    function blur() { setGameMenuVis(true); }
    EventBus.addListener(GameEvent.blur, blur);

    function updateInCombat( inCombat: boolean ) { setInCombat(inCombat); }
    EventBus.addListener(GameEvent.inCombat, updateInCombat);

    function updateGameState( state: GameState ) { setGameState(state); }
    EventBus.addListener(GameEvent.gameState, updateGameState);

    function cleanup() {
      EventBus.removeListener(GameEvent.gameMenu, toggleGameMenu);
      EventBus.removeListener(GameEvent.inCombat, updateInCombat);
      EventBus.removeListener(GameEvent.gameState, updateGameState);
      EventBus.removeListener(GameEvent.blur, blur);
    }

    return () => cleanup();
  }, [location.pathname, isGameURL, gameState, gameType, isCoop, loggedIn, auth.status, opsMask, gameURLParams, redirectToGameUrl, cleanupGame]);

  if ( gameState !== GameState.default )
    return <GameOver loggedIn={loggedIn} gameResult={gameState} cleanupGame={cleanupGame} />;

  return (
    <>
      <div className={`${styles.gameWrapper} ${ isGameURL ? "" : styles.hidden }`}>
        <GameBackground inCombat={inCombat} />
        <Game currentActiveScene={currentActiveScene} gameRef={gameRef} canStartGame={canStartGame} />
        <CombatUI inCombat={inCombat} />
        <GameUI gameMenuVis={gameMenuVis} loggedIn={loggedIn} />
      </div>
    </>
  );
}
