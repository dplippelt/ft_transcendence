import { useNavigate } from "react-router-dom";
import styles from "./LandingPage.module.scss"
import { AppTitle } from "../../components/PageTitle";
import { MenuButtons } from "../../components/ButtonContainers";
import Background from "../../components/Background";
import Page from "../../components/Page";
import { MenuButton } from "../../components/Buttons";
import { RouteParam, RoutePath } from "../../utils/utils";

function GameDescription()
{
	return (
		<div className={styles.gameDescription}>Short game description, similar to short Steam game descriptions on store pages.</div>
	)
}

function Buttons()
{
	const navigate = useNavigate();

	return (
		<MenuButtons>
			<MenuButton label="Start game" onClick={ () => navigate(RoutePath.game) } />
			<MenuButton label="Login" onClick={ () => navigate(RoutePath.auth + RouteParam.login) } />
			<MenuButton label="How to play" onClick={ () => {} } />
			<MenuButton label="Game dev" onClick={ () => navigate(RoutePath.gameDev) } />
		</MenuButtons>
	)
}

export default function LandingPage()
{
	return (
		<>
			<Background/>
			<Page>
				<AppTitle/>
				<GameDescription/>
				<Buttons/>
			</Page>
		</>

	)
}
