import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import Background from "../../components/Background";
import { MenuTitle } from "../../components/PageTitle";
import { MenuButtons } from "../../components/ButtonContainers";
import styles from "./GameOver.module.scss";
import { GameResult, RoutePath } from "../../utils/utils";
import { MenuButton } from "../../components/Buttons";
import SideBar from "../../components/SideBar";

interface ISubText
{
	subText: string;
}

interface IButtons
{
	gameResult: GameResult;
}

function SubText( { subText } : ISubText )
{
	return (
		<div className={styles.subText}>{subText}</div>
	)
}

function Buttons( { gameResult } :IButtons )
{
	const navigate = useNavigate();

	const againText = gameResult === GameResult.won ? "Play again" : "Try again";

	return (
		<MenuButtons>
			<MenuButton label={againText} onClick={ () => navigate(RoutePath.game) } />
			<MenuButton label="Return to main menu" onClick={ () => navigate(RoutePath.mainMenu) } />
		</MenuButtons>
	);
}

export default function GameOver()
{
	const { gameResult } = useParams();
	const location = useLocation();

	if ( !gameResult || ( gameResult !== GameResult.won && gameResult !== GameResult.lost ) )
	{
		const path = location.state && location.state.from ? location.state.from : RoutePath.mainMenu;
		return <Navigate to={path} replace />;
	}

	const title = gameResult === GameResult.won ? "Well done!" : "Game over!";
	const subText = gameResult === GameResult.won ? "You Won!" : "You Lost...";

	return (
		<>
			<Background />
			<div className={styles.gameOver}>
				<MenuTitle title={title} />
				<SubText subText={subText} />
				<Buttons gameResult={gameResult} />
			</div>
			<SideBar />
		</>
	);
}
