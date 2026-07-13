import Background from "../../components/Background";
import { BottomButtons } from "../../components/ButtonContainers";
import { BackButton, BottomButton } from "../../components/Buttons";
import Page from "../../components/Page";
import { MenuTitle } from "../../components/PageTitle";
import FriendsWindow from "./FriendsWindow";
import styles from "./Friends.module.scss";
import ChatWindow from "./ChatWindow";
import { useState } from "react";
import useIsMobile from "../../hooks/useIsMobile";
import React from "react";
import { MobilePosition, RoutePath } from "../../utils/utils";
import Popup from "../../components/Popup";
import AddFriendPopup from "./AddFriendPopup";
import { MobileView } from "./enums";
import RemoveFriendPopup from "./RemoveFriendPopup";
import InviteFriendPopup from "./InviteFriendPopup";
import { PopupType } from "../../components/Chat/enums";
import { useLocation } from "react-router-dom";

interface IButtons
{
	mobileView: MobileView;
	setMobileView: React.Dispatch<React.SetStateAction<MobileView>>;
	setPopuptype: React.Dispatch<React.SetStateAction<PopupType>>;
}

export interface ISetFriendPageState
{
	setMobileView: React.Dispatch<React.SetStateAction<MobileView>>;
	setPopuptype: React.Dispatch<React.SetStateAction<PopupType>>;
	setSelectedFriendID: React.Dispatch<React.SetStateAction<string | undefined>>;
	setActiveFriendID: React.Dispatch<React.SetStateAction<string | undefined>>;
}

interface IFriendsContainer
{
	mobileView: MobileView;
	activeFriendID: string | undefined;
	setPageState: ISetFriendPageState;
}

function Buttons( { mobileView, setMobileView, setPopuptype } : IButtons )
{
	const isMobile = useIsMobile();
	const location = useLocation();
	const path = location.state ? location.state.from : RoutePath.mainMenu;

	return (
		<BottomButtons>
			{ isMobile && mobileView === MobileView.chat
			? <BottomButton label="Back" onClick={ () => setMobileView(MobileView.friends) } mobilePosition={MobilePosition.bottom} />
			: <BackButton path={path} />}
			{ ( !isMobile || ( isMobile && mobileView === MobileView.friends )) && <BottomButton label="Add Friend" onClick={ () => setPopuptype(PopupType.addFriend) } /> }
		</BottomButtons>
	);
}

function FriendsContainer( { mobileView, activeFriendID, setPageState } : IFriendsContainer )
{
	const isMobile = useIsMobile();
	const { setPopuptype, setSelectedFriendID } = setPageState;

	if ( isMobile )
	{
		return (
			<div className={styles.container}>
				{ mobileView === MobileView.friends
				? <FriendsWindow setPageState={setPageState} />
				: <ChatWindow key={activeFriendID} activeFriendID={activeFriendID} setPopuptype={setPopuptype} setSelectedFriendID={setSelectedFriendID} /> }
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<FriendsWindow setPageState={setPageState} />
			<ChatWindow key={activeFriendID} activeFriendID={activeFriendID} setPopuptype={setPopuptype} setSelectedFriendID={setSelectedFriendID} />
		</div>
	);
}

export default function Friends()
{
	const [mobileView, setMobileView] = useState<MobileView>(MobileView.friends);
	const [popupType, setPopuptype] = useState<PopupType>(PopupType.none);
	const [selectedFriendID, setSelectedFriendID] = useState<string | undefined>(undefined);
	const [activeFriendID, setActiveFriendID] = useState<string | undefined>(undefined);
	const setPageState: ISetFriendPageState = { setMobileView, setPopuptype, setSelectedFriendID, setActiveFriendID };

	return (
		<>
			<Background />
			<Page>
				<MenuTitle title="Friends" />
				<FriendsContainer mobileView={mobileView} activeFriendID={activeFriendID} setPageState={setPageState} />
				<Buttons mobileView={mobileView} setMobileView={setMobileView} setPopuptype={setPopuptype} />
				{ popupType === PopupType.addFriend &&
					<Popup>
						<AddFriendPopup setPopuptype={setPopuptype} />
					</Popup> }
				{ popupType === PopupType.removeFriend &&
					<Popup>
						<RemoveFriendPopup
							selectedFriendID={selectedFriendID!}
							activeFriendID={activeFriendID}
							setSelectedFriendID={setSelectedFriendID}
							setActiveFriendID={setActiveFriendID}
							setPopuptype={setPopuptype} />
					</Popup> }
				{ popupType === PopupType.inviteFriend &&
					<Popup>
						<InviteFriendPopup
							selectedFriendID={selectedFriendID!}
							setPopuptype={setPopuptype} />
					</Popup> }
			</Page>
		</>
	);
}
