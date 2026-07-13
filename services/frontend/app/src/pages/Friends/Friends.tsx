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
import { useFriends } from "../../contexts/FriendsContext";

interface IButtons
{
	mobileView: MobileView;
	setMobileView: React.Dispatch<React.SetStateAction<MobileView>>;
	setPopuptype: React.Dispatch<React.SetStateAction<PopupType>>;
}

interface IFriendsContainer
{
	mobileView: MobileView;
	setMobileView: React.Dispatch<React.SetStateAction<MobileView>>;
	setPopuptype: React.Dispatch<React.SetStateAction<PopupType>>;
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

function FriendsContainer( { mobileView, setMobileView, setPopuptype } : IFriendsContainer )
{
	const { activeFriendID } = useFriends()
	const isMobile = useIsMobile();

	if ( isMobile )
	{
		return (
			<div className={styles.container}>
				{ mobileView === MobileView.friends
				? <FriendsWindow setMobileView={setMobileView} setPopuptype={setPopuptype} />
				: <ChatWindow key={activeFriendID} setPopuptype={setPopuptype} /> }
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<FriendsWindow setMobileView={setMobileView} setPopuptype={setPopuptype} />
			<ChatWindow key={activeFriendID} setPopuptype={setPopuptype} />
		</div>
	);
}

export default function Friends()
{
	const [mobileView, setMobileView] = useState<MobileView>(MobileView.friends);
	const [popupType, setPopuptype] = useState<PopupType>(PopupType.none);

	return (
		<>
			<Background />
			<Page>
				<MenuTitle title="Friends" />
				<FriendsContainer mobileView={mobileView} setMobileView={setMobileView} setPopuptype={setPopuptype} />
				<Buttons mobileView={mobileView} setMobileView={setMobileView} setPopuptype={setPopuptype} />
				{ popupType === PopupType.addFriend && <Popup> <AddFriendPopup setPopuptype={setPopuptype} /> </Popup> }
				{ popupType === PopupType.removeFriend && <Popup> <RemoveFriendPopup setPopuptype={setPopuptype} /> </Popup> }
				{ popupType === PopupType.inviteFriend && <Popup> <InviteFriendPopup setPopuptype={setPopuptype} /> </Popup> }
			</Page>
		</>
	);
}
