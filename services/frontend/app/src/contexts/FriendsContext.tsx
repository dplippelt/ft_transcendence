import { createContext, useContext, /* useEffect, */ useState } from "react";
import type { ReactNode } from "react";
import guestAvatar from "../assets/guest_avatar_test.jpg";
import testAvatar from "../assets/mesca_avatar_test.png";

export interface IFriendData
{
	username: string;
	avatar: string;
}

type userID = string;
type Friends = Record<userID, IFriendData>;

// start temporary default friends list for testing
export const defaultFriends: Friends =
{
	"Mesca_ID": {username: "Mesca", avatar: testAvatar},
	"Valr_ID": {username: "Valr", avatar: guestAvatar},
	"Lemon_ID": {username: "Lemon", avatar: testAvatar},
	"Crawly_ID": {username: "Crawly", avatar: guestAvatar},
	"Takato_ID": {username: "Takato", avatar: testAvatar},
	"Seungah_ID": {username: "Seungah", avatar: guestAvatar},
	"Bell_ID": {username: "Bell", avatar: testAvatar},
	"José_ID": {username: "José", avatar: guestAvatar},
	"Friend_1_ID": {username: "Friend 1", avatar: testAvatar},
	"Friend_2_ID": {username: "Friend 2", avatar: guestAvatar},
	"Friend_3_ID": {username: "Friend 3", avatar: testAvatar},
	"Friend_4_ID": {username: "Friend 4", avatar: guestAvatar},
	"Friend_5_ID": {username: "Friend 5", avatar: testAvatar},
	"Friend_6_ID": {username: "Friend 6", avatar: guestAvatar},
	"Friend_7_ID": {username: "Friend 7", avatar: testAvatar},
	"Friend_8_ID": {username: "Friend 8", avatar: guestAvatar},
	"Friend_9_ID": {username: "Friend 9", avatar: testAvatar},
}
// end temporary default friends list for testing

interface IFriendsContext
{
	friends: Friends;
	resetFriends: () => void;
	addFriend: ( username: string ) => void;
	removeFriend: ( friendID: string ) => void;
}

const FriendsContext = createContext<IFriendsContext | null>(null);

export default function FriendsProvider( { children } : {children: ReactNode} )
{
	const [friends, setFriends] = useState<Friends>(defaultFriends);

	function resetFriends()
	{
		setFriends(defaultFriends);
	}

	function addFriend( username: string )
	{
		// Temp mock random avatar image
		// TODO: fetch from DB later
		const avatar = username.length % 2 ? testAvatar : guestAvatar;

		// TODO: remember to set key of Friends object below ( [username]: ) to the userID fetched from DB based on current username instead of just the username
		setFriends(prev => ({
			...prev,
			[username + "_ID"]: {
				username: username,
				avatar: avatar,
			}
		}));
	}

	function removeFriend( friendID: string )
	{
		setFriends(prev =>
		{
			const newFriends = prev;
			delete newFriends[friendID];

			return newFriends;
		})
	}

	// mock template for later when loading accout info from database after login (e.g. when user hits F5 to reload page)
	// at the moment when you hit F5 everything is rerendered and Friends info will be set to default again.
	// turn it into a custom hook because it also needs to be called in the login / signup button handler after a succesful login/sign-up

	// useEffect(() =>
	// {
	// 	async function loadFriends()
	// 	{
	// 		const sessionToken = localStorage.getItem("sessionToken");
	// 		if (await isValidToken(sessionToken))
	// 			setFriends(await fetchDbUser(sessionToken));
	// 	}
	// 	loadFriends();
	// }, []);

	return (
		<FriendsContext.Provider
			value=
			{{
				friends, resetFriends, addFriend, removeFriend,
			}}>
			{children}
		</FriendsContext.Provider>
	);
}

// import and use useFriends() anywhere you want to reference or change Friends values.
export function useFriends()
{
	const context = useContext(FriendsContext);
	if ( !context )
		throw new Error("useFriends() must be used within a FriendsProvider");
	return context;
}
