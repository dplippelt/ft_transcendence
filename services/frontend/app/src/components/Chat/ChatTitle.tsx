import React from "react";
import { Link } from "react-router-dom";
import useIsMobile from "../../hooks/useIsMobile";
import Avatar from "../Avatar";
import { PopupType, AvatarSize, RoutePath } from "../../utils/utils";
import { InviteToPlayButton, SideBarBackButton } from "../Buttons";
import styles from "./ChatTitle.module.scss";
import { useFriends, type IFriendData } from "../../contexts/FriendsContext";

interface IChatTitleSideBar
{
	activeFriendID: string;
	activeFriend: IFriendData;
}

interface IChatTitle
{
	activeFriendID: string | undefined;
	activeFriend: IFriendData | undefined;
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

export function ChatTitleSideBar( { activeFriendID, activeFriend } : IChatTitleSideBar )
{
	const { setActiveFriendID } = useFriends();

	return(
		<div className={styles.chatTitle}>
			<SideBarBackButton onClick={ () => setActiveFriendID(undefined) } />
			<Link to={`${RoutePath.profile}/${activeFriendID}`} className={styles.profileLink}>
				<Avatar src={activeFriend.avatar} alt={`${activeFriend.username}'s avatar`} size={AvatarSize.small} />
				<div className={styles.chatTitleText}>{activeFriend.username}</div>
			</Link>
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
			{ activeFriend && activeFriendID
			? <Link to={`${RoutePath.profile}/${activeFriendID}`} className={styles.profileLink}>
				<Avatar src={activeFriend.avatar} alt={`${activeFriend.username}'s avatar`} size={AvatarSize.small} />
				<div className={styles.chatTitleText}>{activeFriend.username}</div>
			  </Link>
			: <div className={`${styles.chatTitleText} ${extraStyling}`}>{chatTitle()}</div> }
			{ isMobile && activeFriend && <InviteToPlayButton onClick={ () => handleInviteToPlay() } />}
		</div>
	);
}
