import React from "react";
import useIsMobile from "../../hooks/useIsMobile";
import Avatar, { AvatarSize } from "../Avatar";
import { InviteToPlayButton, SideBarBackButton } from "../Buttons";
import { PopupType } from "./enums";
import styles from "./ChatTitle.module.scss";
import type { IFriendData } from "../../contexts/FriendsContext";

interface IChatTitleSideBar
{
	activeFriend: IFriendData;
	setActiveFriendID: React.Dispatch<React.SetStateAction<string | undefined>>;
}

interface IChatTitle
{
	activeFriend: IFriendData | undefined;
	activeFriendID: string | undefined;
	setPopuptype: React.Dispatch<React.SetStateAction<PopupType>>;
	setSelectedFriendID: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export function ChatTitleSideBar( { activeFriend, setActiveFriendID } : IChatTitleSideBar )
{
	return(
		<div className={styles.chatTitle}>
			<SideBarBackButton onClick={ () => setActiveFriendID(undefined) } />
			<Avatar src={activeFriend.avatar} alt={`${activeFriend.username}'s avatar`}  size={AvatarSize.small} />
			<div className={styles.chatTitleText}>{`${activeFriend.username}'s Chat`}</div>
		</div>
	);
}

export function ChatTitle( { activeFriend, activeFriendID, setPopuptype, setSelectedFriendID } : IChatTitle )
{
	const isMobile = useIsMobile();

	function chatTitle() : string
	{
		if (activeFriend)
			return `${activeFriend.username}'s Chat`;
		return "No chat selected";
	}

	function handleInviteToPlay()
	{
		setPopuptype(PopupType.inviteFriend);
		setSelectedFriendID(activeFriendID);
	}

	return(
		<div className={styles.chatTitle}>
			{ activeFriend && <Avatar src={activeFriend.avatar} alt={`${activeFriend.username}'s avatar`}  size={AvatarSize.small} /> }
			<div className={styles.chatTitleText}>{chatTitle()}</div>
			{ isMobile && activeFriend && <InviteToPlayButton onClick={ () => handleInviteToPlay() } />}
		</div>
	);
}
