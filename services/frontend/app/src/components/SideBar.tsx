import React, { useState } from "react";
import { FriendButton, OpenSideBarButton } from "./Buttons";
import styles from "./SideBar.module.scss";
import FriendsList from "./FriendsList";
import ChatHistory from "./Chat/ChatHistory";
import ChatBox from "./Chat/ChatBox";
import { ChatTitleSideBar } from "./Chat/ChatTitle";
import { useUser } from "../contexts/UserContext";

interface ICollapsedSideBar
{
	collapsed: boolean;
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

function SideBarToggle( { setCollapsed } : ICollapsedSideBar )
{
	const userFunc = useUser();

	return <OpenSideBarButton hasNewMsg={userFunc.hasNewMsg()} onClick={ () => setCollapsed(prev => !prev) } />;
}

function SideBar( { activeChat, setActiveChat } : ISideBar )
{
	function handleOpenChat( username: string )
	{
		setActiveChat(username);
	}

	if ( activeChat )
	{
		return (
			<div className={styles.friendsPanel}>
				<ChatTitleSideBar activeChat={activeChat} setActiveChat={setActiveChat} />
				<ChatHistory activeChat={activeChat} />
				<ChatBox activeChat={activeChat} />
			</div>
		);
	}

	return (
		<div className={styles.friendsPanel}>
			<FriendsListTitle />
			<FriendsList>
				{ (username, avatar) => <FriendButton username={username} avatar={avatar} panel={true} onClick={ () => handleOpenChat(username) } /> }
			</FriendsList>
		</div>
	);
}

export default function ChatSideBar()
{
	const [collapsed, setCollapsed] = useState<boolean>(true);
	const [activeChat, setActiveChat] = useState<string | undefined>(undefined);

	return (
		<div className={styles.sideBar}>
			<SideBarToggle collapsed={collapsed} setCollapsed={setCollapsed} />
			{ !collapsed && <SideBar activeChat={activeChat} setActiveChat={setActiveChat} /> }
		</div>
	);
}
