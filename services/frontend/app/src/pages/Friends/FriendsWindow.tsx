import { useUser } from "../../contexts/UserContext";
import useIsMobile from "../../hooks/useIsMobile";
import { MobileView } from "./Friends";
import styles from "./FriendsWindow.module.scss";
import React from "react";

interface IFriendsWindow
{
	setFriendChat: React.Dispatch<React.SetStateAction<string | undefined>>,
	setMobileView: React.Dispatch<React.SetStateAction<MobileView>>,
}

function FriendsListTitle()
{
	return <div className={styles.friendsListTitle}>My Friends</div>
}

function FriendsList( { setFriendChat, setMobileView } : IFriendsWindow )
{
	const isMobile = useIsMobile();
	const { user } = useUser();

	function handleOnClick( username: string )
	{
		setFriendChat(username);

		if ( isMobile )
			setMobileView(MobileView.Chat);
	}

	return (
		<div className={styles.friendsList}>
			{ user.friends.map((username) =>
				<div key={username} className={styles.friend} onClick={ () => handleOnClick(username) }>{username}</div>
			)}
		</div>
	)
}

export default function FriendsWindow( { setFriendChat, setMobileView } : IFriendsWindow )
{
	return (
		<div className={styles.friendsWindow}>
			<FriendsListTitle />
			<FriendsList setFriendChat={setFriendChat} setMobileView={setMobileView} />
		</div>
	)
}


