import { createContext, useContext, /* useEffect, */ useState } from "react";
import type { ReactNode } from "react";

export type UserContextType =
{
	user: User,
	setUser: React.Dispatch<React.SetStateAction<User>>,
}

export type User =
{
	// define data type for each User value
	username: string,
	avatar: string,
}

const UserContext = createContext<UserContextType | null>(null);

export const defaultUser: User =
{
	// define default User values
	username: "Guest",
	avatar: "/src/assets/guest_avatar_test.jpg",
};

export default function UserProvider( { children } : {children: ReactNode} )
{
	const [user, setUser] = useState<User>(defaultUser);

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
				user, setUser,
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
