import { useNavigate } from "react-router-dom";
import styles from "./LandingPage.module.css"

function AppTitle()
{
	return (
		<div className="appTitle">Math Crawler</div>
	);
}

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
		<div className="menuButtons">
			<button onClick={ () => navigate("/login") }>Login</button>
			<button onClick={ () => navigate("/signup") }>Sign-up</button>
			<button>How to play</button>
			<button>Continue as guest</button>
			<button>Game dev</button>
			<button onClick={ () => navigate("/card-tester") }>Card tester</button>
		</div>
	)
}

export default function LandingPage()
{
	return (
		<>
			<div className="background"/>
			<div className={styles.landingPage}>
				<AppTitle/>
				<GameDescription/>
				<Buttons/>
			</div>
		</>

	)
}
