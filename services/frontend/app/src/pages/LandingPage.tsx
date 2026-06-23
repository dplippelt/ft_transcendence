import { useNavigate } from "react-router-dom";
import styles from "./LandingPage.module.scss"
import { AppTitle } from "../components/PageTitle";
import { MenuButtons } from "../components/ButtonContainers";
import Background from "../components/Background";
import Page from "../components/Page";

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
			<button onClick={ () => navigate("/auth?mode=login") }>Login</button>
			<button onClick={ () => navigate("/main-menu") }>Continue as guest</button>
			<button>How to play</button>
			<button onClick={ () => navigate("/game-dev") }>Game dev</button>
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
