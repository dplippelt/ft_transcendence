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
	setSelectedFriend: React.Dispatch<React.SetStateAction<string>>;
	setActiveChat: React.Dispatch<React.SetStateAction<string | undefined>>;
}

interface IFriendsContainer
{
	mobileView: MobileView;
	activeChat: string | undefined;
	setPageState: ISetFriendPageState;
}

function Buttons( { mobileView, setMobileView, setPopuptype } : IButtons )
{
	const isMobile = useIsMobile();

	return (
		<BottomButtons>
			{ isMobile && mobileView === MobileView.chat
			? <BottomButton label="Back" onClick={ () => setMobileView(MobileView.friends) } mobilePosition={MobilePosition.bottom} />
			: <BackButton path={RoutePath.mainMenu} />}
			{ ( !isMobile || ( isMobile && mobileView === MobileView.friends )) && <BottomButton label="Add Friend" onClick={ () => setPopuptype(PopupType.addFriend) } /> }
		</BottomButtons>
	);
}

function FriendsContainer( { mobileView, activeChat, setPageState } : IFriendsContainer )
{
	const isMobile = useIsMobile();
	const { setPopuptype, setSelectedFriend } = setPageState;

	if ( isMobile )
	{
		return (
			<div className={styles.container}>
				{ mobileView === MobileView.friends
				? <FriendsWindow setPageState={setPageState} />
				: <ChatWindow key={activeChat} activeChat={activeChat} setPopuptype={setPopuptype} setSelectedFriend={setSelectedFriend} /> }
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<FriendsWindow setPageState={setPageState} />
			<ChatWindow key={activeChat} activeChat={activeChat} setPopuptype={setPopuptype} setSelectedFriend={setSelectedFriend} />
		</div>
	);
}

export default function Friends()
{
	const [mobileView, setMobileView] = useState<MobileView>(MobileView.friends);
	const [popupType, setPopuptype] = useState<PopupType>(PopupType.none);
	const [selectedFriend, setSelectedFriend] = useState<string>("");
	const [activeChat, setActiveChat] = useState<string | undefined>(undefined);
	const setPageState: ISetFriendPageState = { setMobileView, setPopuptype, setSelectedFriend, setActiveChat };

	return (
		<>
			<Background />
			<Page>
				<MenuTitle title="Friends" />
				<FriendsContainer mobileView={mobileView} activeChat={activeChat} setPageState={setPageState} />
				<Buttons mobileView={mobileView} setMobileView={setMobileView} setPopuptype={setPopuptype} />
				{ popupType === PopupType.addFriend && <Popup> <AddFriendPopup setPopuptype={setPopuptype} /> </Popup>}
				{ popupType === PopupType.removeFriend && <Popup> <RemoveFriendPopup username={selectedFriend} setPopuptype={setPopuptype} /> </Popup>}
				{ popupType === PopupType.inviteFriend && <Popup> <InviteFriendPopup username={selectedFriend} setPopuptype={setPopuptype} /> </Popup>}
			</Page>
		</>
	);
}
