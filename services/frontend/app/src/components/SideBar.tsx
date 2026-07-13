import React, { useState } from "react";
import { FriendButton, OpenSideBarButton } from "./Buttons";
import styles from "./SideBar.module.scss";
import FriendsList from "./FriendsList";
import ChatHistory from "./Chat/ChatHistory";
import ChatBox from "./Chat/ChatBox";
import { ChatTitleSideBar } from "./Chat/ChatTitle";
import useIsMobile from "../hooks/useIsMobile";
import { useLocation, useNavigate } from "react-router-dom";
import { RoutePath } from "../utils/utils";
import { useChatHistory } from "../contexts/ChatHistoryContext";
import { useFriends } from "../contexts/FriendsContext";

interface ISidePanelToggle
{
	setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

function FriendsListTitle()
{
	return <div className={styles.friendsListTitle}>My Friends</div>
}

function SidePanelToggle( { setCollapsed } : ISidePanelToggle )
{
	const { hasNewMsg } = useChatHistory();
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

	return <OpenSideBarButton hasNewMsg={hasNewMsg()} onClick={handleClick} />;
}

function SidePanel()
{
	const { friends, activeFriendID, setActiveFriendID } = useFriends();
	const activeFriend = activeFriendID ? friends[activeFriendID] : undefined;

	function handleOpenChat( userID: string )
	{
		setActiveFriendID(userID);
	}

	if ( activeFriend )
	{
		return (
			<div className={styles.friendsPanel}>
				<ChatTitleSideBar activeFriend={activeFriend} />
				<ChatHistory />
				<ChatBox />
			</div>
		);
	}

	return (
		<div className={styles.friendsPanel}>
			<FriendsListTitle />
			<FriendsList>
				{ (friendID, username, avatar) =>
					<FriendButton
						username={username}
						friendID={friendID}
						avatar={avatar}
						panel={true}
						onClick={ () => handleOpenChat(friendID) } /> }
			</FriendsList>
		</div>
	);
}

export default function SideBar()
{
	const [collapsed, setCollapsed] = useState<boolean>(true);

	return (
		<div className={styles.sideBar}>
			<SidePanelToggle setCollapsed={setCollapsed} />
			{ !collapsed && <SidePanel /> }
		</div>
	);
}
