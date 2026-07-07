import { createContext, useContext, /* useEffect, */ useState } from "react";
import type { ReactNode } from "react";
import guestAvatar from "../assets/guest_avatar_test.jpg";
import testAvatar from "../assets/mesca_avatar_test.png";

// TODO: Add Separate ChatHistoryContext and FriendsContext

export interface IChatMsg
{
	username: string;
	message: string;
	read: boolean;
}

export interface IFriendData
{
	username: string;
	avatar: string;
	chatHistory: IChatMsg[];
}

type userID = string;
type Friends = Record<userID, IFriendData>;

// start temporary default friends list for testing
const friends: Friends =
{
	"Mesca_ID": {username: "Mesca", avatar: testAvatar, chatHistory: []},
	"Valr_ID": {username: "Valr", avatar: guestAvatar, chatHistory: []},
	"Lemon_ID": {username: "Lemon", avatar: testAvatar, chatHistory: []},
	"Crawly_ID": {username: "Crawly", avatar: guestAvatar, chatHistory: []},
	"Takato_ID": {username: "Takato", avatar: testAvatar, chatHistory: []},
	"Seungah_ID": {username: "Seungah", avatar: guestAvatar, chatHistory: []},
	"Bell_ID": {username: "Bell", avatar: testAvatar, chatHistory: []},
	"José_ID": {username: "José", avatar: guestAvatar, chatHistory: []},
	"Friend_1_ID": {username: "Friend 1", avatar: testAvatar, chatHistory: []},
	"Friend_2_ID": {username: "Friend 2", avatar: guestAvatar, chatHistory: []},
	"Friend_3_ID": {username: "Friend 3", avatar: testAvatar, chatHistory: []},
	"Friend_4_ID": {username: "Friend 4", avatar: guestAvatar, chatHistory: []},
	"Friend_5_ID": {username: "Friend 5", avatar: testAvatar, chatHistory: []},
	"Friend_6_ID": {username: "Friend 6", avatar: guestAvatar, chatHistory: []},
	"Friend_7_ID": {username: "Friend 7", avatar: testAvatar, chatHistory: []},
	"Friend_8_ID": {username: "Friend 8", avatar: guestAvatar, chatHistory: []},
	"Friend_9_ID": {username: "Friend 9", avatar: testAvatar, chatHistory: []},
}
// end temporary default friends list for testing

interface IUserContext
{
	user: IUser;
	setUserID: ( userID: string ) => void;
	updateUsername: ( username: string ) => void;
	resetUser: () => void;
	updateAvatar: ( newAvatar: string ) => void;
	addChatHistory: ( username: string, message: string ) => void;
	setChatToRead: ( username: string ) => void;
	hasNewMsg: () => boolean;
	numUnreadMsg: ( username: string ) => number;
	addFriend: ( username: string ) => void;
	removeFriend: ( username: string ) => void;
}

export interface IUser
{
	// define data type for each User value
	userID: string;
	username: string;
	avatar: string;
	friends: Friends;
}

const UserContext = createContext<IUserContext | null>(null);

export const defaultUser: IUser =
{
	// define default User values
	userID: "Guest",
	username: "Guest",
	avatar: guestAvatar,
	friends: friends,
};

export default function UserProvider( { children } : {children: ReactNode} )
{
	const [user, setUser] = useState<IUser>(defaultUser);

	function setUserID( newUserID: string )
	{
		setUser( prev => ({ ...prev, userID: newUserID }));
	}

	function updateUsername( newUsername: string )
	{
		setUser( prev =>
		{
			const oldUsername = prev.username;

			// Convert the Friend Record into an array of [friendID, friend] pairs so we can loop over it
			// in order to update the user's username in every friend chat
			const updatedHistory: [string, IFriendData][] = Object.entries(prev.friends).map(([friendID, friend]) => [
				friendID,
				{
					...friend,
					chatHistory: friend.chatHistory.map(msg =>
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

	function resetUser()
	{
		setUser(defaultUser);
	}

	function updateAvatar( newAvatar: string )
	{
		setUser(prev => ({ ...prev, avatar: newAvatar }));
	}

	function addChatHistory( username: string, message: string )
	{
		// NOTE: Setting read to false only for demonstration purposes.
		// 		 Should be true eventually as a message written by the user themselves should never be "unread" for them
		//		 For now, writing a new message to a friend will create new "unread" messages which will trigger the "new/unread messages" effect
		//		 To "read" them you will need to (re)open the friends chat window
		const newMsg: IChatMsg = { username: user.username, message: message, read: false }; // TODO: set read to true later!!!;

		setUser(prev => ({
			...prev,
			friends: Object.fromEntries(
				Object.entries(prev.friends).map(([key, friend]) =>
					friend.username === username
						? [key, { ...friend, chatHistory: [...friend.chatHistory, newMsg] }]
						: [key, friend]
				)
			)
		}));
	}

	function setChatToRead( username: string )
	{
		setUser(prev =>
		{
			const friend = prev.friends[username];
			const hasUnread = friend.chatHistory.some(msg => !msg.read);

			if ( !hasUnread )
				return prev;

			const updatedFriends: Friends = {
				...prev.friends,
				[username]: {
					...friend,
					chatHistory: friend.chatHistory.map(msg => ({ ...msg, read: true })),
				},
			};

			return { ...prev, friends: updatedFriends };
		})
	}

	function hasNewMsg() : boolean
	{
		return Object.values(user.friends).some(data =>
			data.chatHistory.some(({ read }) => !read)
		);
	}

	function numUnreadMsg( username: string ) : number
	{
		const chatHistory: IChatMsg[] = user.friends[username].chatHistory;

		return chatHistory.filter(({read}) => !read).length;
	}

	function addFriend( username: string )
	{
		// Temp mock random avatar image
		// TODO: fetch from DB later
		const avatar = username.length % 2 ? testAvatar : guestAvatar;

		// TODO: remember to set key of Friends object below ( [username]: ) to the userID fetched from DB based on current username instead of just the username
		setUser(prev => ({
			...prev,
			friends: {
				...prev.friends,
				[username + "_ID"]: {
					username: username,
					avatar: avatar,
					chatHistory: []
				}
			}
		}));
	}

	function removeFriend( username: string )
	{
		setUser(prev => ({
			...prev,
			friends: Object.fromEntries(
				Object.entries(prev.friends).filter(([_key, friend]) => friend.username !== username)
			)
		}));
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
				user, setUserID, updateUsername, resetUser, updateAvatar, addChatHistory, setChatToRead, hasNewMsg, numUnreadMsg, addFriend, removeFriend,
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
