import { FriendButton, InviteToPlayButton, RemoveFriendButton } from "../../components/Buttons";
import { useUser } from "../../contexts/UserContext";
import useIsMobile from "../../hooks/useIsMobile";
import { MobileView, PopupType } from "./enums";
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
	const { user } = useUser();
	const { setMobileView, setActiveChat, setPopuptype, setSelectedFriend } = setPageState;

	function handleOpenChat( username: string )
	{
		setActiveChat(username);

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

	// Convert Friends Record to an array of [username, data] pairs so it can be looped over (and sort alphabetically on username)
	const friends = Object.entries(user.friends).sort(([username_a], [username_b]) => username_a.localeCompare(username_b));

	return (
		<div className={styles.friendsList}>
			{ friends.map(([username, {avatar}]) =>
				<div className={styles.friend} key={username}>
					<FriendButton username={username} avatar={avatar} onClick={ () => handleOpenChat(username) } />
					<InviteToPlayButton onClick={ () => handleInviteToPlay(username) } />
					<RemoveFriendButton onClick={ () => handleRemoveFriend(username) } />
				</div>
			)}
		</div>
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


