import { useLocation, useNavigate } from "react-router-dom";
import styles from "./MainMenu.module.scss"
import { AppTitle } from "../../components/PageTitle";
import { MenuButtons } from "../../components/ButtonContainers";
import Background from "../../components/Background";
import { useAuth } from "../../contexts/AuthContext";
import { MenuButton } from "../../components/Buttons";
import { useUser } from "../../contexts/UserContext";
import { RoutePath } from "../../utils/utils";
import SideBar from "../../components/SideBar";

function Buttons()
{
	const navigate = useNavigate();
	const location = useLocation();
	const auth = useAuth();
	const user = useUser();

	function logout()
	{
		auth.logout();
		user.resetUser();
		localStorage.clear();
		navigate(RoutePath.landingPage);
	}

	return (
		<MenuButtons>
			<MenuButton label="New game" onClick={ () => {} } />
			<MenuButton label="Multiplayer" onClick={ () => {} } />
			<MenuButton label="Friends" onClick={ () => navigate(RoutePath.friends) } />
			<MenuButton label="Profile" onClick={ () => navigate(RoutePath.profile) } />
			<MenuButton label="Leaderboard" onClick={ () => navigate(RoutePath.leaderboard, { state: { from: location.pathname } }) } />
			<MenuButton label="How to play" onClick={ () => {} } />
			<MenuButton label="Settings" onClick={ () => navigate(RoutePath.settings) } />
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
				<AppTitle />
				<Buttons />
				<SideBar />
			</div>
		</>
	)
}
