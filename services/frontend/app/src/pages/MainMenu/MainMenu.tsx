import { useNavigate } from "react-router-dom";
import styles from "./MainMenu.module.scss"
import { AppTitle } from "../../components/PageTitle";
import { MenuButtons } from "../../components/ButtonContainers";
import Background from "../../components/Background";
import { defaultAccount, useAccount } from "../../contexts/AccountContext";
import { MenuButton } from "../../components/Buttons";

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
			<MenuButton label="New game" onClick={ () => {} } />
			<MenuButton label="Multiplayer" onClick={ () => {} } />
			<MenuButton label="Friends" onClick={ () => {} } />
			<MenuButton label="Profile" onClick={ () => navigate("/profile") } />
			<MenuButton label="Leaderboard" onClick={ () => navigate("/leaderboard") } />
			<MenuButton label="How to play" onClick={ () => {} } />
			<MenuButton label="Settings" onClick={ () => navigate("/settings") } />
			<MenuButton label="Logout" onClick={ logout } />
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
