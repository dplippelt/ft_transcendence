import Popup from "./Popup";
import { MenuButtons } from "./ButtonContainers";
import { MenuButton } from "./Buttons";
import { GameEvent, RoutePath } from "../utils/utils";
import { useAuth } from "../contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import useSessionCleanup from "../hooks/useSessionCleanup";
import { EventBus } from "../game/EventBus";

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
			<MenuButton label="Continue" onClick={ () => EventBus.emit(GameEvent.gameMenu) } />
			<MenuButton label="Friends" onClick={ () => navigate(RoutePath.friends, { state: { from: location.pathname } }) } />
			<MenuButton label="Profile" onClick={ () => navigate(RoutePath.profile, { state: { from: location.pathname } }) } />
			<MenuButton label="Leaderboard" onClick={ () => navigate(RoutePath.leaderboard, { state: { from: location.pathname } }) } />
			<MenuButton label="How to play" onClick={ () => {} } />
			<MenuButton label="Settings" onClick={ () => navigate(RoutePath.settings, { state: { from: location.pathname } }) } />
			<MenuButton label="Back to main menu" onClick={ () => navigate(RoutePath.mainMenu, { replace: true }) } />
			<MenuButton label="Logout" onClick={ logout } />
		</MenuButtons>
	)
}

export default function GameMenu()
{
	return (
		<Popup>
			<Buttons />
		</Popup>
	)
}
