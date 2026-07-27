import { useLocation, useNavigate } from "react-router-dom";
import styles from "./MainMenu.module.scss"
import { AppTitle } from "../../components/PageTitle";
import { MenuButtons } from "../../components/ButtonContainers";
import Background from "../../components/Background";
import { useAuth } from "../../contexts/AuthContext";
import { MenuButton } from "../../components/Buttons";
import { RoutePath } from "../../utils/utils";
import SideBar from "../../components/SideBar";
import useSessionCleanup from "../../hooks/useSessionCleanup";
import { useError } from "../../contexts/ErrorContext";
import { ErrorType } from "../../utils/errors";
import Popup from "../../components/Popup";
import ErrorPopup from "../../components/ErrorPopup";

function Buttons()
{
	const navigate = useNavigate();
	const location = useLocation();
	const auth = useAuth();
	const sessionCleanup = useSessionCleanup();

	function logout()
	{
		auth.logout();
		sessionCleanup();
		navigate(RoutePath.landingPage);
	}

	return (
		<MenuButtons>
			<MenuButton label="New game" onClick={ () => {} } />
			<MenuButton label="Multiplayer" onClick={ () => navigate(RoutePath.multiplayer) } />
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
	const { error } = useError();

	return (
		<>
			<Background/>
			<div className={styles.mainMenuPage}>
				<AppTitle />
				<Buttons />
				<SideBar />
				{ error !== ErrorType.none && <Popup> <ErrorPopup /> </Popup> }
			</div>
		</>
	)
}
