import React from "react";
import useIsMobile from "../../hooks/useIsMobile";
import Avatar from "../Avatar";
import { PopupType, AvatarSize } from "../../utils/utils";
import { InviteToPlayButton, SideBarBackButton } from "../Buttons";
import styles from "./ChatTitle.module.scss";
import { useFriends, type IFriendData } from "../../contexts/FriendsContext";

interface IChatTitleSideBar
{
	activeFriend: IFriendData;
}

interface IChatTitle
{
	activeFriendID: string | undefined;
	activeFriend: IFriendData | undefined;
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

export function ChatTitleSideBar( { activeFriend } : IChatTitleSideBar )
{
	const { setActiveFriendID } = useFriends();

	return(
		<div className={styles.chatTitle}>
			<SideBarBackButton onClick={ () => setActiveFriendID(undefined) } />
			<Avatar src={activeFriend.avatar} alt={`${activeFriend.username}'s avatar`}  size={AvatarSize.small} />
			<div className={styles.chatTitleText}>{activeFriend.username}</div>
		</div>
	);
}

export function ChatTitle( { activeFriendID, activeFriend, setPopupType } : IChatTitle )
{
	const { setSelectedFriendID } = useFriends();
	const isMobile = useIsMobile(720);
	const extraStyling = setExtraStyling();

	function setExtraStyling() : string
	{
		if (activeFriend)
			return "";
		return styles.noChatSelected;
	}

	function chatTitle() : string
	{
		if (activeFriend)
			return activeFriend.username;
		return "No chat selected";
	}

	function handleInviteToPlay()
	{
		setPopupType(PopupType.inviteFriend);
		setSelectedFriendID(activeFriendID);
	}

	return(
		<div className={styles.chatTitle}>
			{ activeFriend && <Avatar src={activeFriend.avatar} alt={`${activeFriend.username}'s avatar`}  size={AvatarSize.small} /> }
			<div className={`${styles.chatTitleText} ${extraStyling}`}>{chatTitle()}</div>
			{ isMobile && activeFriend && <InviteToPlayButton onClick={ () => handleInviteToPlay() } />}
		</div>
	);
}
