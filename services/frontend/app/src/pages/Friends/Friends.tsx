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
import { MobilePosition } from "../../utils/utils";

interface IButtons
{
	mobileView: MobileView;
	setMobileView: React.Dispatch<React.SetStateAction<MobileView>>;
}

interface IFriendsContainer
{
	mobileView: MobileView;
	setMobileView: React.Dispatch<React.SetStateAction<MobileView>>;
}

export enum MobileView
{
	Friends,
	Chat,
}

function Buttons( { mobileView, setMobileView } : IButtons )
{
	const isMobile = useIsMobile();

	return (
		<BottomButtons>
			{ isMobile && mobileView === MobileView.Chat
			? <BottomButton label="Back" onClick={ () => setMobileView(MobileView.Friends) } mobilePosition={MobilePosition.bottom} />
			: <BackButton />}
		</BottomButtons>
	);
}

function FriendsContainer( { mobileView, setMobileView } : IFriendsContainer )
{
	const isMobile = useIsMobile();
	const [friendChat, setFriendChat] = useState<string | undefined>(undefined);

	if ( isMobile )
	{
		return (
			<div className={styles.container}>
				{ mobileView === MobileView.Friends
				? <FriendsWindow friendChat={friendChat} setFriendChat={setFriendChat} setMobileView={setMobileView} />
				: <ChatWindow key={friendChat} friendChat={friendChat} /> }
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<FriendsWindow friendChat={friendChat} setFriendChat={setFriendChat} setMobileView={setMobileView} />
			<ChatWindow key={friendChat} friendChat={friendChat} />
		</div>
	);
}

export default function Friends()
{
	const [mobileView, setMobileView] = useState<MobileView>(MobileView.Friends);

	return (
		<>
			<Background />
			<Page>
				<MenuTitle title="Friends" />
				<FriendsContainer mobileView={mobileView} setMobileView={setMobileView} />
				<Buttons mobileView={mobileView} setMobileView={setMobileView} />
			</Page>
		</>
	);
}
