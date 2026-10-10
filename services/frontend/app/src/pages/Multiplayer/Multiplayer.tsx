import { useNavigate } from "react-router-dom";
import Background from "../../components/Background";
import Page from "../../components/Page";
import { MenuTitle } from "../../components/PageTitle";
import SideBar from "../../components/SideBar";
import { GameType, PopupType, RoutePath } from "../../utils/utils";
import { MenuButtons } from "../../components/ButtonContainers";
import { MenuButton } from "../../components/Buttons";
import styles from "./Multiplayer.module.scss";
import { useState } from "react";
import Popup from "../../components/Popup";
import CreateLobbyPopup from "./CreateLobbyPopup";
import LocalCoopPopup from "./LocalCoopPopup";
import OperatorSelectionPopup from "../../components/OperatorSelectionPopup";
import useBack from "../../hooks/useBack";

interface IButtons
{
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

function Buttons( { setPopupType } : IButtons )
{
	const navigate = useNavigate();
	const goBack = useBack();

	return (
		<MenuButtons extraStyling={styles.buttonsOffset}>
			<MenuButton label="Create game" onClick={() => setPopupType(PopupType.createLobby) } />
			<MenuButton label="Browse games" onClick={ () => navigate(RoutePath.mpBrowser) } />
			<MenuButton label="Local co-op" onClick={ () => setPopupType(PopupType.localCoop) } />
			<MenuButton label="Back" onClick={ () => goBack(RoutePath.mainMenu) } />
		</MenuButtons>
	);
}

export default function Multiplayer()
{
	const [ popupType, setPopupType ] = useState<PopupType>(PopupType.none);

	return (
		<>
			<Background />
			<Page>
				<MenuTitle title="Multiplayer" />
				<Buttons setPopupType={setPopupType} />
				<SideBar />
				{ popupType === PopupType.createLobby && <Popup> <CreateLobbyPopup setPopupType={setPopupType} /> </Popup> }
				{ popupType === PopupType.localCoop && <Popup> <LocalCoopPopup setPopupType={setPopupType} /> </Popup> }
				{ popupType === PopupType.operatorSelection && <Popup> <OperatorSelectionPopup setPopupType={setPopupType} gameType={GameType.LocalCoop} /> </Popup> }
			</Page>
		</>
	);
}
