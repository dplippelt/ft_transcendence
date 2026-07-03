import Background from "../../components/Background";
import { BottomButtons } from "../../components/ButtonContainers";
import { BackButton, BottomButton } from "../../components/Buttons";
import Page from "../../components/Page";
import { MenuTitle } from "../../components/PageTitle";
import FriendsWindow from "./FriendsWindow";
import styles from "./Friends.module.scss";
import ChatWindow, { type IChatMsg } from "./ChatWindow";
import { useState } from "react";
import useIsMobile from "../../hooks/useIsMobile";
import React from "react";

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

type ChatHistory = Record<string, IChatMsg[]>;

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
			? <BottomButton label="Back" onClick={ () => setMobileView(MobileView.Friends) } mobilePosition="mobileBottom" />
			: <BackButton />}
		</BottomButtons>
	);
}

function FriendsContainer( { mobileView, setMobileView } : IFriendsContainer )
{
	const isMobile = useIsMobile();
	const [friendChat, setFriendChat] = useState<string | undefined>(undefined);

	// temporary state var for saving chat history -- needs to be replaced with database fetch
	const [allChatHist, setAllChatHist] = useState<ChatHistory>({});

	function chatHistory() : IChatMsg[]
	{
		if ( friendChat )
			return allChatHist[friendChat] ?? [];
		return [];
	}

	function addMessage( message: IChatMsg )
	{
		if ( !friendChat )
			return;
		setAllChatHist(prev => ({
			...prev,
			[friendChat]: [...(prev[friendChat] ?? []), message]
		}));
	}

	if ( isMobile )
	{
		return (
			<div className={styles.container}>
				{ mobileView === MobileView.Friends
				? <FriendsWindow setFriendChat={setFriendChat} setMobileView={setMobileView} />
				: <ChatWindow key={friendChat} friendChat={friendChat} chatHistory={chatHistory} addMessage={addMessage} /> }
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<FriendsWindow setFriendChat={setFriendChat} setMobileView={setMobileView} />
			<ChatWindow key={friendChat} friendChat={friendChat} chatHistory={chatHistory} addMessage={addMessage} />
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
