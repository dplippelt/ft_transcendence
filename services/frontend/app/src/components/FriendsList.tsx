import React from "react";
import styles from "./FriendsList.module.scss";
import { useFriends } from "../contexts/FriendsContext";

interface IFriendsList
{
	children: (friendID: string, username: string, avatar: string) => React.ReactNode;
}

export default function FriendsList( { children } : IFriendsList )
{
	const { friends } = useFriends();

	// Convert Friends Record to an array of [friendID, friendData] pairs so it can be looped over (and sort alphabetically on username)
	const friendsArr = Object.entries(friends).sort(
		(
			[, { username: username_a }],
			[, { username: username_b }]
		) => username_a.localeCompare(username_b)
	);

	return (
		<div className={styles.friendsList}>
			{ friendsArr.map(([friendID, { username, avatar }]) =>
				<div className={styles.friend} key={username}>
					{ children(friendID, username, avatar) }
				</div>
			)}
		</div>
	);
}
