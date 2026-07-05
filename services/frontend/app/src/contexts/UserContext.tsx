import { createContext, useContext, /* useEffect, */ useState } from "react";
import type { ReactNode } from "react";
import guestAvatar from "../assets/guest_avatar_test.jpg";
import testAvatar from "../assets/mesca_avatar_test.png";

//Note: Do we want a separate ChatHistoryContext or FriendsContext later or keep it grouped with other user data like this?

export interface IChatMsg
{
	username: string;
	message: string;
}

interface IFriendData
{
	avatar: string;
	chatHistory: IChatMsg[];
}

type username = string;
type Friends = Record<username, IFriendData>;

// start temporary default friends list for testing
const friends: Friends =
{
	"Mesca": {avatar: testAvatar, chatHistory: []},
	"Valr": {avatar: guestAvatar, chatHistory: []},
	"Lemon": {avatar: testAvatar, chatHistory: []},
	"Crawly": {avatar: guestAvatar, chatHistory: []},
	"Takato": {avatar: testAvatar, chatHistory: []},
	"Seungah": {avatar: guestAvatar, chatHistory: []},
	"Bell": {avatar: testAvatar, chatHistory: []},
	"José": {avatar: guestAvatar, chatHistory: []},
	"Friend 1": {avatar: testAvatar, chatHistory: []},
	"Friend 2": {avatar: guestAvatar, chatHistory: []},
	"Friend 3": {avatar: testAvatar, chatHistory: []},
	"Friend 4": {avatar: guestAvatar, chatHistory: []},
	"Friend 5": {avatar: testAvatar, chatHistory: []},
	"Friend 6": {avatar: guestAvatar, chatHistory: []},
	"Friend 7": {avatar: testAvatar, chatHistory: []},
	"Friend 8": {avatar: guestAvatar, chatHistory: []},
	"Friend 9": {avatar: testAvatar, chatHistory: []},
}
// end temporary default friends list for testing

interface IUserContext
{
	user: IUser;
	updateUsername: ( username: string ) => void;
	resetUsername: () => void;
	updateAvatar: ( newAvatar: string ) => void;
	addChatHistory: ( username: string, message: string ) => void;
	addFriend: ( username: string ) => void;
	removeFriend: ( username: string ) => void;
}

export interface IUser
{
	// define data type for each User value
	username: string;
	avatar: string;
	friends: Friends;
}

const UserContext = createContext<IUserContext | null>(null);

export const defaultUser: IUser =
{
	// define default User values
	username: "Guest",
	avatar: guestAvatar,
	friends: friends,
};

export default function UserProvider( { children } : {children: ReactNode} )
{
	const [user, setUser] = useState<IUser>(defaultUser);

	function updateUsername( newUsername: string )
	{
		setUser( prev =>
		{
			const oldUsername = prev.username;

			// Convert the Friend Record into an array of [username, data] pairs so we can loop over it
			// in order to update the user's username in every friend chat
			const updatedHistory: [string, IFriendData][] = Object.entries(prev.friends).map(([friendName, data]) => [
				friendName,
				{
					...data,
					chatHistory: data.chatHistory.map(msg =>
						msg.username === oldUsername
							? { ...msg, username: newUsername }
							: msg
					)
				}
			]);

			// Convert the updated array back into a Friend Record
			const updatedFriends: Friends = Object.fromEntries(updatedHistory);

			return { ...prev, username: newUsername, friends: updatedFriends };
		});
	}

	function resetUsername()
	{
		setUser(defaultUser);
	}

	function updateAvatar( newAvatar: string )
	{
		setUser(prev => ({ ...prev, avatar: newAvatar }));
	}

	function addChatHistory( username: string, message: string )
	{
		const newMsg: IChatMsg = { username: user.username, message: message };

		setUser(prev => ({
			...prev,
			friends: {
				...prev.friends,
				[username]: {
					...prev.friends[username],
					chatHistory: [...prev.friends[username].chatHistory, newMsg]
				}
			}
		}));
	}

	function addFriend( username: string )
	{
		//Temp mock random avatar image, fetch from DB later
		const avatar = username.length % 2 ? testAvatar : guestAvatar;

		setUser(prev => ({
			...prev,
			friends: {
				...prev.friends,
				[username]: {
					avatar: avatar,
					chatHistory: []
				}
			}
		}));
	}

	function removeFriend( username: string )
	{
		setUser(prev =>
		{
			const { [username]: _removedFriend, ...remainingFriends } = prev.friends;
			return { ...prev, friends: remainingFriends };
		});
	}

	// mock template for later when loading accout info from database after login (e.g. when user hits F5 to reload page)
	// at the moment when you hit F5 everything is rerendered and User info will be set to default again.
	// turn it into a custom hook because it also needs to be called in the login / signup button handler after a succesful login/sign-up

	// useEffect(() =>
	// {
	// 	async function loadUser()
	// 	{
	// 		const sessionToken = localStorage.getItem("sessionToken");
	// 		if (await isValidToken(sessionToken))
	// 			setUser(await fetchDbUser(sessionToken));
	// 	}
	// 	loadUser();
	// }, []);

	return (
		<UserContext.Provider
			value=
			{{
				user, updateUsername, resetUsername, updateAvatar, addChatHistory, addFriend, removeFriend,
			}}>
			{children}
		</UserContext.Provider>
	);
}

// import and use useUser() anywhere you want to reference or change User values.
export function useUser()
{
	const context = useContext(UserContext);
	if ( !context )
		throw new Error("useUser() must be used within a UserProvider");
	return context;
}
