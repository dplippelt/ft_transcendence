import { useNavigate } from "react-router-dom";
import styles from "./LandingPage.module.css"
import menuBG from "../../assets/menu_bg.png"

function AppTitle()
{
	return (
		<div className={styles.appTitle}>Math Crawler</div>
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
		<div className={styles.buttons}>
			<button>Login</button>
			<button>Sign-up</button>
			<button>How to play</button>
			<button>Continue as guest</button>
			<button>Game dev</button>
			<button onClick={ () => navigate("/card_tester") }>Card tester</button>
		</div>
	)
}

export default function LandingPage()
{
	return (
		<>
			<div className={styles.background} style={{ backgroundImage: `url(${menuBG})` }} />
			<div className={styles.landingPage}>
				<AppTitle/>
				<GameDescription/>
				<Buttons/>
			</div>
		</>

	)
}
