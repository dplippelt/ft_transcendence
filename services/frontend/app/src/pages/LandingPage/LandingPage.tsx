import { useNavigate } from "react-router-dom";
import styles from "./LandingPage.module.scss"
import { AppTitle } from "../../components/PageTitle";
import { MenuButtons } from "../../components/ButtonContainers";
import Background from "../../components/Background";
import Page from "../../components/Page";
import { MenuButton } from "../../components/Buttons";
import { buildRoute, DEFAULT_OPS_MASK, GameType, getPathToGame, RouteParamKey, RouteParamValue, RoutePath } from "../../utils/utils";

function GameDescription()
{
	return (
		<div className={styles.gameDescription}>Short game description, similar to short Steam game descriptions on store pages.</div>
	)
}

function Buttons()
{
	const navigate = useNavigate();

	function handleNewGame()
	{
		const ops = parseInt(DEFAULT_OPS_MASK, 2);
		navigate(getPathToGame(ops, GameType.SinglePlayer));
	}

	return (
		<MenuButtons>
			<MenuButton label="Start game" onClick={handleNewGame} />
			<MenuButton label="Login" onClick={ () => navigate(buildRoute(RoutePath.auth, { [RouteParamKey.mode]: RouteParamValue.login })) } />
			<MenuButton label="How to play" onClick={ () => {} } />
		</MenuButtons>
	)
}

export default function LandingPage()
{
	return (
		<>
			<Background />
			<Page>
				<AppTitle />
				<GameDescription />
				<Buttons />
			</Page>
		</>

	)
}
