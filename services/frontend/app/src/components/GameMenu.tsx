import Popup from "./Popup";
import { MenuButtons } from "./ButtonContainers";
import { GameMenuButton } from "./Buttons";
import { GameEvent, RoutePath } from "../utils/utils";
import { useAuth } from "../contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import useSessionCleanup from "../hooks/useSessionCleanup";
import { EventBus } from "../game/EventBus";
import styles from "./GameMenu.module.scss";

function Buttons()
{
	const navigate = useNavigate();
	const location = useLocation();
	const { logout, auth } = useAuth();
	const sessionCleanup = useSessionCleanup();
	const loggedIn = auth.status === "authenticated";

	function handleLogout()
	{
		logout();
		sessionCleanup();
		navigate(RoutePath.landingPage, { replace: true });
	}

	return (
		<MenuButtons extraStyling={styles.gameMenuButtons}>
			<GameMenuButton label="Continue" onClick={ () => EventBus.emit(GameEvent.gameMenu) } />
			{ loggedIn && <GameMenuButton label="Friends" onClick={ () => navigate(RoutePath.friends, { state: { from: location.pathname, gameMenu: true } }) } /> }
			{ loggedIn && <GameMenuButton label="Profile" onClick={ () => navigate(RoutePath.profile, { state: { from: location.pathname, gameMenu: true } }) } /> }
			{ loggedIn && <GameMenuButton label="Leaderboard" onClick={ () => navigate(RoutePath.leaderboard, { state: { from: location.pathname, gameMenu: true } }) } /> }
			<GameMenuButton label="How to play" onClick={ () => {} } />
			{ loggedIn && <GameMenuButton label="Settings" onClick={ () => navigate(RoutePath.settings, { state: { from: location.pathname, gameMenu: true } }) } /> }
			{ loggedIn && <GameMenuButton label="Return to main menu" onClick={ () => navigate(RoutePath.mainMenu, { replace: true }) } /> }
			<GameMenuButton label={ loggedIn ? "Logout" : "Quit" } onClick={ handleLogout } />
		</MenuButtons>
	)
}

export default function GameMenu()
{
	return (
		<Popup extraStyling={styles.gameMenu} backdropStyling={styles.backdrop}>
			<Buttons />
		</Popup>
	)
}
