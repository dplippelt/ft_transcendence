import { useNavigate } from "react-router-dom";
import styles from "./MainMenu.module.scss"
import { AppTitle } from "../../components/PageTitle";
import { MenuButtons } from "../../components/ButtonContainers";
import Background from "../../components/Background";
import { useAuth } from "../../contexts/AuthContext";
import { MenuButton } from "../../components/Buttons";
import { useUser } from "../../contexts/UserContext";

function Buttons()
{
	const navigate = useNavigate();
	const auth = useAuth();
	const user = useUser();

	function logout()
	{
		auth.logout();
		user.resetUser();
		navigate("/");
	}

	return (
		<MenuButtons>
			<MenuButton label="New game" onClick={ () => {} } />
			<MenuButton label="Multiplayer" onClick={ () => {} } />
			<MenuButton label="Friends" onClick={ () => navigate("/friends") } />
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
