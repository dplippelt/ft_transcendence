import { useNavigate } from "react-router-dom";
import Background from "../Background";
import { MenuTitle } from "../PageTitle";
import { MenuButtons } from "../ButtonContainers";
import styles from "./GameOver.module.scss";
import { GameState, RoutePath } from "../../utils/utils";
import { MenuButton } from "../Buttons";
import SideBar from "../SideBar";

interface ISubText
{
	subText: string;
}

interface IButtons
{
	loggedIn: boolean;
	gameResult: GameState;
	cleanupGame: () => void;
}

interface IGameOver
{
	loggedIn: boolean;
	gameResult: GameState;
	cleanupGame: () => void;
}

function SubText( { subText } : ISubText )
{
	return <div className={styles.subText}>{subText}</div>;
}

function Buttons( { loggedIn, gameResult, cleanupGame } :IButtons )
{
	const navigate = useNavigate();

	const againText = gameResult === GameState.won ? "Play again" : "Try again";

	function startNewGame() { cleanupGame(); }
	function exitGame() { navigate( loggedIn ? RoutePath.mainMenu : RoutePath.landingPage ); }

	return (
		<MenuButtons>
			<MenuButton label={againText} onClick={startNewGame} />
			<MenuButton label="Exit game" onClick={exitGame} />
		</MenuButtons>
	);
}

export default function GameOver( { loggedIn, gameResult, cleanupGame } : IGameOver )
{
	const title = gameResult === GameState.won ? "Well done!" : "Game over!";
	const subText = gameResult === GameState.won ? "You Won!" : "You Lost...";

	return (
		<>
			<Background />
			<div className={styles.gameOver}>
				<MenuTitle title={title} />
				<SubText subText={subText} />
				<Buttons loggedIn={loggedIn} gameResult={gameResult} cleanupGame={cleanupGame} />
			</div>
			{ loggedIn && <SideBar /> }
		</>
	);
}
