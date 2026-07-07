import { FriendButton, InviteToPlayButton, RemoveFriendButton } from "../../components/Buttons";
import { PopupType } from "../../components/Chat/enums";
import TheFriendsList from "../../components/FriendsList";
import useIsMobile from "../../hooks/useIsMobile";
import { MobileView } from "./enums";
import type { ISetFriendPageState } from "./Friends";
import styles from "./FriendsWindow.module.scss";

interface IFriendsWindow
{
	setPageState: ISetFriendPageState;
}

function FriendsListTitle()
{
	return <div className={styles.friendsListTitle}>My Friends</div>
}

function FriendsList( { setPageState } : IFriendsWindow )
{
	const isMobile = useIsMobile();
	const { setMobileView, setActiveChat, setPopuptype, setSelectedFriend } = setPageState;

	function handleOpenChat( userID: string )
	{
		setActiveChat(userID);

		if ( isMobile )
			setMobileView(MobileView.chat);
	}

	function handleInviteToPlay( username: string )
	{
		setPopuptype(PopupType.inviteFriend);
		setSelectedFriend(username);
	}

	function handleRemoveFriend( username: string )
	{
		setPopuptype(PopupType.removeFriend);
		setSelectedFriend(username);
	}

	return (
		<TheFriendsList>
			{ (userID, username, avatar) => (
				<>
					<FriendButton username={username} avatar={avatar} panel={false} onClick={ () => handleOpenChat(userID) } />
					<InviteToPlayButton onClick={ () => handleInviteToPlay(username) } />
					<RemoveFriendButton onClick={ () => handleRemoveFriend(username) } />
				</>
			)}
		</TheFriendsList>
	)
}

export default function FriendsWindow( { setPageState } : IFriendsWindow )
{
	return (
		<div className={styles.friendsWindow}>
			<FriendsListTitle />
			<FriendsList setPageState={setPageState} />
		</div>
	)
}


