import { useNavigate } from "react-router-dom";
import styles from "./MainMenu.module.scss"
import { AppTitle } from "../components/PageTitle";
import { MenuButtons } from "../components/ButtonContainers";
import Background from "../components/Background";

function Buttons()
{
	const navigate = useNavigate();

	return (
		<MenuButtons>
			<button>New game</button>
			<button>Multiplayer</button>
			<button>Friends</button>
			<button>Profile</button>
			<button>Leaderboard</button>
			<button>How to play</button>
			<button onClick={ () => navigate("/settings") }>Settings</button>
			<button onClick={ () => navigate("/") }>Logout</button>
		</MenuButtons>
	)
}

export default function MainMenu()
{
	return (
		<>
			<Background/>
			<div className={styles.mainMenuPage}>
				<AppTitle/>
				<Buttons/>
			</div>
		</>

	)
}
