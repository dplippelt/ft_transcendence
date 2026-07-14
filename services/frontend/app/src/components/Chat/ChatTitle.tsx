import React from "react";
import type { IFriendData } from "../../contexts/UserContext";
import useIsMobile from "../../hooks/useIsMobile";
import Avatar, { AvatarSize } from "../Avatar";
import { InviteToPlayButton, SideBarBackButton } from "../Buttons";
import { PopupType } from "./enums";
import styles from "./ChatTitle.module.scss";

interface IChatTitleSideBar
{
	activeFriend: IFriendData;
	setActiveChat: React.Dispatch<React.SetStateAction<string | undefined>>;
}

interface IChatTitle
{
	activeFriend: IFriendData | undefined;
	setPopuptype: React.Dispatch<React.SetStateAction<PopupType>>;
	setSelectedFriend: React.Dispatch<React.SetStateAction<string>>;
}

export function ChatTitleSideBar( { activeFriend, setActiveChat } : IChatTitleSideBar )
{
	return(
		<div className={styles.chatTitle}>
			<SideBarBackButton onClick={ () => setActiveChat(undefined) } />
			<Avatar src={activeFriend.avatar} alt={`${activeFriend.username}'s avatar`}  size={AvatarSize.small} />
			<div className={styles.chatTitleText}>{`${activeFriend.username}'s Chat`}</div>
		</div>
	);
}

export function ChatTitle( { activeFriend, setPopuptype, setSelectedFriend } : IChatTitle )
{
	const isMobile = useIsMobile();

	function chatTitle() : string
	{
		if (activeFriend)
			return `${activeFriend.username}'s Chat`;
		return "No chat selected";
	}

	function handleInviteToPlay( username: string )
	{
		setPopuptype(PopupType.inviteFriend);
		setSelectedFriend(username);
	}

	return(
		<div className={styles.chatTitle}>
			{ activeFriend && <Avatar src={activeFriend.avatar} alt={`${activeFriend.username}'s avatar`}  size={AvatarSize.small} /> }
			<div className={styles.chatTitleText}>{chatTitle()}</div>
			{ isMobile && activeFriend && <InviteToPlayButton onClick={ () => handleInviteToPlay(activeFriend.username) } />}
		</div>
	);
}
