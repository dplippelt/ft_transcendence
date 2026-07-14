import React from "react";
import { useUser } from "../contexts/UserContext";
import styles from "./FriendsList.module.scss";

interface IFriendsList
{
	children: (userUD: string, username: string, avatar: string) => React.ReactNode;
}

export default function FriendsList( { children } : IFriendsList )
{
	const { user } = useUser();

	// Convert Friends Record to an array of [username, data] pairs so it can be looped over (and sort alphabetically on username)
	const friends = Object.entries(user.friends).sort(([username_a], [username_b]) => username_a.localeCompare(username_b));

	return (
		<div className={styles.friendsList}>
			{ friends.map(([userID, { username, avatar }]) =>
				<div className={styles.friend} key={username}>
					{ children(userID, username, avatar) }
				</div>
			)}
		</div>
	);
}
