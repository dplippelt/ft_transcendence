import { useNavigate } from "react-router-dom";
import styles from "./MainMenu.module.scss"

function AppTitle()
{
	return (
		<div className="appTitle">Math Crawler</div>
	);
}

function Buttons()
{
	const navigate = useNavigate();

	return (
		<div className="menuButtons">
			<button>New game</button>
			<button>Multiplayer</button>
			<button>Friends</button>
			<button>Profile</button>
			<button onClick={ () => navigate("/leaderboard") }>Leaderboard</button>
			<button onClick={ () => navigate("/settings") }>Settings</button>
			<button>How to play</button>
			<button onClick={ () => navigate("/") }>Logout</button>
		</div>
	)
}

export default function MainMenu()
{
	return (
		<>
			<div className="background"/>
			<div className={styles.mainMenuPage}>
				<AppTitle/>
				<Buttons/>
			</div>
		</>

	)
}
