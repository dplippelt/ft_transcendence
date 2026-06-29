import { createContext, useContext, /* useEffect, */ useState } from "react";
import type { ReactNode } from "react";
import guestAvatar from "../assets/guest_avatar_test.jpg";

interface IUserContext
{
	user: IUser;
	updateUsername: ( username: string ) => void;
	resetUsername: () => void;
	updateAvatar: ( newAvatar: string ) => void;
}

export interface IUser
{
	// define data type for each User value
	username: string;
	avatar: string;
}

const UserContext = createContext<IUserContext | null>(null);

export const defaultUser: IUser =
{
	// define default User values
	username: "Guest",
	avatar: guestAvatar,
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
				user, updateUsername, resetUsername, updateAvatar,
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
