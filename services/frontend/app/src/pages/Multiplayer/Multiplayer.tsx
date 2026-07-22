import { useNavigate } from "react-router-dom";
import Background from "../../components/Background";
import Page from "../../components/Page";
import { MenuTitle } from "../../components/PageTitle";
import SideBar from "../../components/SideBar";
import { PopupType, RoutePath } from "../../utils/utils";
import { MenuButtons } from "../../components/ButtonContainers";
import { MenuButton } from "../../components/Buttons";
import styles from "./Multiplayer.module.scss";
import { useState } from "react";
import Popup from "../../components/Popup";
import CreateLobbyPopup from "./CreateLobbyPopup";

interface IButtons
{
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

function Buttons( { setPopupType } : IButtons )
{
	const navigate = useNavigate();

	return (
		<MenuButtons extraStyling={styles.buttonsOffset}>
			<MenuButton label="Create game" onClick={() => setPopupType(PopupType.createLobby) } />
			<MenuButton label="Browse games" onClick={ () => navigate(RoutePath.mpBrowser) } />
			<MenuButton label="Local co-op" onClick={ () => {} } />
			<MenuButton label="Back" onClick={ () => navigate(RoutePath.mainMenu) } />
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
			</Page>
		</>
	);
}
