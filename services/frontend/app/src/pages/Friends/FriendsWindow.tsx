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
	const { setMobileView, setActiveFriendID, setPopuptype, setSelectedFriendID } = setPageState;

	function handleOpenChat( friendID: string )
	{
		setActiveFriendID(friendID);

		if ( isMobile )
			setMobileView(MobileView.chat);
	}

	function handleInviteToPlay( friendID: string )
	{
		setPopuptype(PopupType.inviteFriend);
		setSelectedFriendID(friendID);
	}

	function handleRemoveFriend( friendID: string )
	{
		setPopuptype(PopupType.removeFriend);
		setSelectedFriendID(friendID);
	}

	return (
		<TheFriendsList>
			{ (friendID, username, avatar) => (
				<>
					<FriendButton username={username} friendID={friendID} avatar={avatar} panel={false} onClick={ () => handleOpenChat(friendID) } />
					<InviteToPlayButton onClick={ () => handleInviteToPlay(friendID) } />
					<RemoveFriendButton onClick={ () => handleRemoveFriend(friendID) } />
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
