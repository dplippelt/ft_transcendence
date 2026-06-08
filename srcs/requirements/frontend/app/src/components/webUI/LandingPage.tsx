import { useNavigate } from "react-router-dom";
import styles from "./LandingPage.module.scss"
import type { Controls } from "../../App";

type LandingPageProps =
{
	controls: Controls,
}

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

function Buttons( { controls } : LandingPageProps )
{
	const navigate = useNavigate();

	return (
		<div className="menuButtons">
			<button onClick={ () => navigate("/login") }>Login</button>
			<button onClick={ () => navigate("/signup") }>Sign-up</button>
			<button>How to play</button>
			<button onClick={ () => { controls.guestLogin(); navigate("/main-menu"); } }>Continue as guest</button>
			<button>Game dev</button>
			<button onClick={ () => navigate("/card-tester") }>Card tester</button>
		</div>
	)
}

export default function LandingPage( { controls } : LandingPageProps )
{
	return (
		<>
			<div className="background"/>
			<div className={styles.landingPage}>
				<AppTitle/>
				<GameDescription/>
				<Buttons controls={controls}/>
			</div>
		</>

	)
}
