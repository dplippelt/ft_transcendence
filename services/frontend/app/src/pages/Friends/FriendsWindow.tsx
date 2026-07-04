import { FriendButton, InviteToPlayButton, RemoveFriendButton } from "../../components/Buttons";
import { useUser } from "../../contexts/UserContext";
import useIsMobile from "../../hooks/useIsMobile";
import { MobileView } from "./Friends";
import styles from "./FriendsWindow.module.scss";
import React from "react";

interface IFriendsWindow
{
	friendChat: string | undefined;
	setFriendChat: React.Dispatch<React.SetStateAction<string | undefined>>,
	setMobileView: React.Dispatch<React.SetStateAction<MobileView>>,
}

function FriendsListTitle()
{
	return <div className={styles.friendsListTitle}>My Friends</div>
}

function FriendsList( { friendChat, setFriendChat, setMobileView } : IFriendsWindow )
{
	const isMobile = useIsMobile();
	const { user, ...userFunc } = useUser();

	function handleOpenChat( username: string )
	{
		setFriendChat(username);

		if ( isMobile )
			setMobileView(MobileView.Chat);
	}

	// placeholder function
	function handleInviteToPlay( username: string )
	{
		void username;
	}

	function handleRemoveFriend( username: string )
	{
		userFunc.removeFriend(username);
		if ( friendChat === username )
			setFriendChat(undefined);
	}

	const friends = Object.entries(user.friends);

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

export default function FriendsWindow( { friendChat, setFriendChat, setMobileView } : IFriendsWindow )
{
	return (
		<div className={styles.friendsWindow}>
			<FriendsListTitle />
			<FriendsList friendChat={friendChat} setFriendChat={setFriendChat} setMobileView={setMobileView} />
		</div>
	)
}


