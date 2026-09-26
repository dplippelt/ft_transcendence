import { useNavigate } from "react-router-dom";
import styles from "./LandingPage.module.scss"
import { AppTitle } from "../../components/PageTitle";
import { MenuButtons } from "../../components/ButtonContainers";
import Background from "../../components/Background";
import Page from "../../components/Page";
import { MenuButton } from "../../components/Buttons";
import { buildRoute, PopupType, RouteParamKey, RouteParamValue, RoutePath } from "../../utils/utils";
import { useState } from "react";
import Popup from "../../components/Popup";
import OperatorSelection from "../../components/OperatorSelection";

interface IButtons
{
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

function GameDescription()
{
	return (
		<div className={styles.gameDescription}>Short game description, similar to short Steam game descriptions on store pages.</div>
	)
}

function Buttons( { setPopupType } : IButtons )
{
	const navigate = useNavigate();

	function handleNewGame()
	{
		setPopupType(PopupType.operatorSelection);
	}

	// TODO: remove Game dev Button
	return (
		<MenuButtons>
			<MenuButton label="Start game" onClick={handleNewGame} />
			<MenuButton label="Login" onClick={ () => navigate(buildRoute(RoutePath.auth, { [RouteParamKey.mode]: RouteParamValue.login })) } />
			<MenuButton label="How to play" onClick={ () => {} } />
		</MenuButtons>
	)
}

export default function LandingPage()
{
	const [ popupType, setPopupType ] = useState<PopupType>(PopupType.none);

	return (
		<>
			<Background />
			<Page>
				<AppTitle />
				<GameDescription />
				<Buttons setPopupType={setPopupType} />
				{ popupType === PopupType.operatorSelection && <Popup> <OperatorSelection setPopupType={setPopupType} /> </Popup> }
			</Page>
		</>

	)
}
