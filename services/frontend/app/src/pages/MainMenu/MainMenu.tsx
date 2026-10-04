import { useNavigate } from "react-router-dom";
import styles from "./MainMenu.module.scss"
import { AppTitle } from "../../components/PageTitle";
import { MenuButtons } from "../../components/ButtonContainers";
import Background from "../../components/Background";
import { useAuth } from "../../contexts/AuthContext";
import { MenuButton } from "../../components/Buttons";
import { GameType, PopupType, RoutePath } from "../../utils/utils";
import SideBar from "../../components/SideBar";
import useSessionCleanup from "../../hooks/useSessionCleanup";
import { useError } from "../../contexts/ErrorContext";
import { ErrorType } from "../../utils/errors";
import Popup from "../../components/Popup";
import ErrorPopup from "../../components/ErrorPopup";
import React, { useState } from "react";
import OperatorSelectionPopup from "../../components/OperatorSelectionPopup";

interface IButtons
{
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

function Buttons( { setPopupType } : IButtons )
{
	const navigate = useNavigate();
	const { logout } = useAuth();
	const sessionCleanup = useSessionCleanup();

	function handleLogout()
	{
		logout();
		sessionCleanup();
		navigate(RoutePath.landingPage);
	}

	// TODO: pass url query param for game type
	// WAS THIS: <MenuButton label="Start game" onClick={ () => navigate(RoutePath.game + RouteParam.sp) } />
	// RouteParam.sp was "?mode=sp"
	function handleNewGame()
	{
		setPopupType(PopupType.operatorSelection);
	}

	return (
		<MenuButtons>
			<MenuButton label="New game" onClick={handleNewGame} />
			<MenuButton label="Multiplayer" onClick={ () => navigate(RoutePath.multiplayer) } />
			<MenuButton label="Friends" onClick={ () => navigate(RoutePath.friends) } />
			<MenuButton label="Profile" onClick={ () => navigate(RoutePath.profile) } />
			<MenuButton label="Leaderboard" onClick={ () => navigate(RoutePath.leaderboard) } />
			<MenuButton label="How to play" onClick={ () => {} } />
			<MenuButton label="Settings" onClick={ () => navigate(RoutePath.settings) } />
			<MenuButton label="Logout" onClick={ handleLogout } />
		</MenuButtons>
	)
}

export default function MainMenu()
{
	const { error } = useError();
	const [ popupType, setPopupType ] = useState<PopupType>(PopupType.none);

	return (
		<>
			<Background/>
			<div className={styles.mainMenuPage}>
				<AppTitle />
				<Buttons setPopupType={setPopupType} />
				<SideBar />

				{
					error !== ErrorType.none &&
					<Popup>
						<ErrorPopup />
					</Popup>
				}

				{
					popupType === PopupType.operatorSelection &&
					<Popup>
						<OperatorSelectionPopup setPopupType={setPopupType} gameType={GameType.SinglePlayer} />
					</Popup>
				}
			</div>
		</>
	)
}
