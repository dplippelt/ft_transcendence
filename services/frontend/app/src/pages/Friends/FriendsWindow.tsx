import Avatar, { AvatarSize } from "../../components/Avatar";
import { useUser, type Friends } from "../../contexts/UserContext";
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

	const friends = Object.entries(user.friends);

	return (
		<div className={styles.friendsList}>
			{ friends.map(([username, avatar]) =>
				<div key={username} className={styles.friend} onClick={ () => handleOnClick(username) }>
					<Avatar src={avatar} alt={`${username}'s avatar`} size={AvatarSize.smaller} />
					<div className={styles.username}>{username}</div>
				</div>
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


