import React, { useState } from "react";
import { FriendButton, OpenSideBarButton } from "./Buttons";
import styles from "./SideBar.module.scss";
import FriendsList from "./FriendsList";
import ChatHistory from "./Chat/ChatHistory";
import ChatBox from "./Chat/ChatBox";
import { ChatTitleSideBar } from "./Chat/ChatTitle";
import { useUser } from "../contexts/UserContext";
import useIsMobile from "../hooks/useIsMobile";
import { useLocation, useNavigate } from "react-router-dom";
import { RoutePath } from "../utils/utils";

interface ISidePanelToggle
{
	setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

interface ISideBar
{
	activeChat: string | undefined;
	setActiveChat: React.Dispatch<React.SetStateAction<string | undefined>>;
}

function FriendsListTitle()
{
	return <div className={styles.friendsListTitle}>My Friends</div>
}

function SidePanelToggle( { setCollapsed } : ISidePanelToggle )
{
	const userFunc = useUser();
	const isMobile = useIsMobile();
	const navigate = useNavigate();
	const location = useLocation();

	function handleClick()
	{
		if ( isMobile )
			navigate(RoutePath.friends, { state: { from: location.pathname } });
		else
			setCollapsed(prev => !prev);
	}

	return <OpenSideBarButton hasNewMsg={userFunc.hasNewMsg()} onClick={handleClick} />;
}

function SidePanel( { activeChat, setActiveChat } : ISideBar )
{
	const { user } = useUser();
	const activeFriend = activeChat ? user.friends[activeChat] : undefined;

	function handleOpenChat( userID: string )
	{
		setActiveChat(userID);
	}

	if ( activeFriend )
	{
		return (
			<div className={styles.friendsPanel}>
				<ChatTitleSideBar activeFriend={activeFriend} setActiveChat={setActiveChat} />
				<ChatHistory activeFriend={activeFriend} />
				<ChatBox activeFriend={activeFriend} />
			</div>
		);
	}

	return (
		<div className={styles.friendsPanel}>
			<FriendsListTitle />
			<FriendsList>
				{ (userID, username, avatar) => <FriendButton username={username} avatar={avatar} panel={true} onClick={ () => handleOpenChat(userID) } /> }
			</FriendsList>
		</div>
	);
}

export default function SideBar()
{
	const [collapsed, setCollapsed] = useState<boolean>(true);
	const [activeChat, setActiveChat] = useState<string | undefined>(undefined);

	return (
		<div className={styles.sideBar}>
			<SidePanelToggle setCollapsed={setCollapsed} />
			{ !collapsed && <SidePanel activeChat={activeChat} setActiveChat={setActiveChat} /> }
		</div>
	);
}
