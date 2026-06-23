import { useNavigate } from "react-router-dom";
import styles from "./MainMenu.module.scss"
import { AppTitle } from "../../components/PageTitle";
import { MenuButtons } from "../../components/ButtonContainers";
import Background from "../../components/Background";
import { defaultAccount, useAccount } from "../../contexts/AccountContext";

function Buttons()
{
	const navigate = useNavigate();
	const { setAccount } = useAccount();

	function logout()
	{
		setAccount(defaultAccount);
		navigate("/");
	}

	return (
		<MenuButtons>
			<button>New game</button>
			<button>Multiplayer</button>
			<button>Friends</button>
			<button onClick={ () => navigate("/profile") }>Profile</button>
			<button onClick={ () => navigate("/leaderboard") }>Leaderboard</button>
			<button>How to play</button>
			<button onClick={ () => navigate("/settings") }>Settings</button>
			<button onClick={ logout }>Logout</button>
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
