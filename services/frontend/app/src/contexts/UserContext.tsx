import { createContext, useContext, /* useEffect, */ useState } from "react";
import type { ReactNode } from "react";
import guestAvatar from "../assets/guest_avatar_test.jpg";
import testAvatar from "../assets/mesca_avatar_test.png";

// start temporary friends list
type username = string;
type avatar = string;
export type Friends = Record<username, avatar>;

const friends: Friends =
{
	"Mesca": testAvatar,
	"Valr": guestAvatar,
	"Lemon": testAvatar,
	"Crawly": guestAvatar,
	"Takato": testAvatar,
	"Seungah": guestAvatar,
	"Bell": testAvatar,
	"José": guestAvatar,
	"Friend 1": testAvatar,
	"Friend 2": guestAvatar,
	"Friend 3": testAvatar,
	"Friend 4": guestAvatar,
	"Friend 5": testAvatar,
	"Friend 6": guestAvatar,
	"Friend 7": testAvatar,
	"Friend 8": guestAvatar,
	"Friend 9": testAvatar,
}
// end temporary friends list

interface IUserContext
{
	user: IUser;
	updateUsername: ( username: string ) => void;
	resetUsername: () => void;
	updateAvatar: ( newAvatar: string ) => void;
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

	function updateUsername( username: string )
	{
		setUser( prev => ({ ...prev, username: username }) );
	}

	function resetUsername()
	{
		setUser(defaultUser);
	}

	function updateAvatar( newAvatar: string )
	{
		setUser(prev => ({ ...prev, avatar: newAvatar }));
	}

	function addFriend( username: string )
	{
		//Temp mock random avatar image, fetch from DB later
		const avatar = username.length % 2 ? testAvatar : guestAvatar;

		setUser(prev => ({ ...prev, friends: { ...prev.friends, [username]: avatar } }));
	}

	function removeFriend( username: string )
	{
		const { [username]: _removedFriend, ...remainingFriends } = user.friends;
		setUser(prev => ({ ...prev, friends: remainingFriends }));
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
				user, updateUsername, resetUsername, updateAvatar, addFriend, removeFriend,
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
