import Background from "../../components/Background";
import { BottomButtons } from "../../components/ButtonContainers";
import { BackButton, BottomButton } from "../../components/Buttons";
import Page from "../../components/Page";
import { MenuTitle } from "../../components/PageTitle";
import FriendsWindow from "./FriendsWindow";
import styles from "./Friends.module.scss";
import ChatWindow from "./ChatWindow";
import { useEffect, useState } from "react";
import useIsMobile from "../../hooks/useIsMobile";
import React from "react";
import { MobilePosition, MobileView, PopupType, RoutePath } from "../../utils/utils";
import Popup from "../../components/Popup";
import AddFriendPopup from "./AddFriendPopup";
import RemoveFriendPopup from "./RemoveFriendPopup";
import InviteFriendPopup from "./InviteFriendPopup";
import { useLocation } from "react-router-dom";
import { useFriends } from "../../contexts/FriendsContext";

interface IButtons
{
	mobileView: MobileView;
	setMobileView: React.Dispatch<React.SetStateAction<MobileView>>;
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

interface IFriendsContainer
{
	mobileView: MobileView;
	setMobileView: React.Dispatch<React.SetStateAction<MobileView>>;
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

function Buttons( { mobileView, setMobileView, setPopupType } : IButtons )
{
	const isMobile = useIsMobile(720);
	const location = useLocation();
	const path = location.state?.from ?? RoutePath.mainMenu;

	return (
		<BottomButtons>
			{ isMobile && mobileView === MobileView.chat
			? <BottomButton label="Back" onClick={ () => setMobileView(MobileView.friends) } mobilePosition={MobilePosition.bottom} />
			: <BackButton path={path} />}
			{ ( !isMobile || ( isMobile && mobileView === MobileView.friends )) && <BottomButton label="Add Friend" onClick={ () => setPopupType(PopupType.addFriend) } /> }
		</BottomButtons>
	);
}

function FriendsContainer( { mobileView, setMobileView, setPopupType } : IFriendsContainer )
{
	const { activeFriendID } = useFriends()
	const isMobile = useIsMobile(720);

	useEffect(() =>
	{
		if ( isMobile && !activeFriendID )
			setMobileView(MobileView.friends);
	}, [isMobile, activeFriendID]);

	if ( isMobile )
	{
		return (
			<div className={styles.container}>
				{ mobileView === MobileView.friends
				? <FriendsWindow setMobileView={setMobileView} setPopupType={setPopupType} />
				: <ChatWindow setPopupType={setPopupType} /> }
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<FriendsWindow setMobileView={setMobileView} setPopupType={setPopupType} />
			<ChatWindow setPopupType={setPopupType} />
		</div>
	);
}

export default function Friends()
{
	const [mobileView, setMobileView] = useState<MobileView>(MobileView.friends);
	const [popupType, setPopupType] = useState<PopupType>(PopupType.none);

	return (
		<>
			<Background />
			<Page>
				<MenuTitle title="Friends" />
				<FriendsContainer mobileView={mobileView} setMobileView={setMobileView} setPopupType={setPopupType} />
				<Buttons mobileView={mobileView} setMobileView={setMobileView} setPopupType={setPopupType} />
				{ popupType === PopupType.addFriend && <Popup> <AddFriendPopup setPopupType={setPopupType} /> </Popup> }
				{ popupType === PopupType.removeFriend && <Popup> <RemoveFriendPopup setPopupType={setPopupType} /> </Popup> }
				{ popupType === PopupType.inviteFriend && <Popup> <InviteFriendPopup setPopupType={setPopupType} /> </Popup> }
			</Page>
		</>
	);
}
