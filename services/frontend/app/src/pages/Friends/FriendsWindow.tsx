import useIsMobile from "../../hooks/useIsMobile";
import { MobileView } from "./Friends";
import styles from "./FriendsWindow.module.scss";
import React from "react";

interface IFriendsWindow
{
	setFriendChat: React.Dispatch<React.SetStateAction<string | undefined>>,
	setMobileView: React.Dispatch<React.SetStateAction<MobileView>>,
}

// start temporary friend usernames
const friends =
[
	"Mesca",
	"Valr",
	"Lemon",
	"Crawly",
	"Takato",
	"Seungah",
	"Bell",
	"José",
	"Friend 1",
	"Friend 2",
	"Friend 3",
	"Friend 4",
	"Friend 5",
	"Friend 6",
	"Friend 7",
	"Friend 8",
	"Friend 9",
];
// end temporary friend usernames

function FriendsListTitle()
{
	return <div className={styles.friendsListTitle}>My Friends</div>
}

function FriendsList( { setFriendChat, setMobileView } : IFriendsWindow )
{
	const isMobile = useIsMobile();

	function handleOnClick( username: string )
	{
		setFriendChat(username);

		if ( isMobile )
			setMobileView(MobileView.Chat);
	}

	return (
		<div className={styles.friendsList}>
			{ friends.map((username) =>
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


