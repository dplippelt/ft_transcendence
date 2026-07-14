import React, { useState } from "react";
import { FriendButton, OpenChatSideBarButton } from "../Buttons";
import styles from "./ChatSideBar.module.scss";
import FriendsList from "../FriendsList";

interface ICollapsedSideBar
{
	collapsed: boolean;
	setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

function FriendsListTitle()
{
	return <div className={styles.friendsListTitle}>My Friends</div>
}

function SideBarToggle( { collapsed, setCollapsed } : ICollapsedSideBar )
{
	const [hasNewMsg, setNewMsg] = useState<boolean>(false); //temp

	return <OpenChatSideBarButton hasNewMsg={hasNewMsg} onClick={ () => setCollapsed(prev => !prev) } />
}

function SideBar()
{
	// const isMobile = useIsMobile();
	// const { setMobileView, setActiveChat, setPopuptype, setSelectedFriend } = setPageState;

	function handleOpenChat( username: string )
	{
		// setActiveChat(username);
		void username;
	}

	return (
		<div className={styles.friendsPanel}>
			<FriendsListTitle />
			<FriendsList>
				{ (username, avatar) => <FriendButton username={username} avatar={avatar} onClick={ () => handleOpenChat(username) } /> }
			</FriendsList>
		</div>
	)
}

export default function ChatSideBar()
{
	const [collapsed, setCollapsed] = useState<boolean>(false);

	return (
		<div className={styles.sideBar}>
			<SideBarToggle collapsed={collapsed} setCollapsed={setCollapsed} />
			{ !collapsed && <SideBar /> }
		</div>
	);
}
