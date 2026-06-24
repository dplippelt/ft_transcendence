import { createContext, useContext, /* useEffect, */ useState } from "react";
import type { ReactNode } from "react";

export type AuthContextType =
{
	auth: Auth,
	setAuth: React.Dispatch<React.SetStateAction<Auth>>,
}

export type Auth =
{
	// define data type for each Auth value
	guest: boolean,
	username: string,
}

const AuthContext = createContext<AuthContextType | null>(null);

export const defaultAuth: Auth =
{
	// define default Auth values
	guest: true,
	username: "Guest",
	// add sessionToken
};

export default function AuthProvider( { children } : {children: ReactNode} )
{
	const [auth, setAuth] = useState<Auth>(defaultAuth);

	// mock template for later when loading accout info from database after login (e.g. when user hits F5 to reload page)
	// at the moment when you hit F5 everything is rerendered and Auth info will be set to default again.
	// turn it into a custom hook because it also needs to be called in the login / signup button handler after a succesful login/sign-up

	// useEffect(() =>
	// {
	// 	async function loadAuth()
	// 	{
	// 		const sessionToken = localStorage.getItem("sessionToken");
	// 		if (await isValidToken(sessionToken))
	// 			setAuth(await fetchDbAuth(sessionToken));
	// 	}
	// 	loadAuth();
	// }, []);

	return (
		<AuthContext.Provider
			value=
			{{
				auth, setAuth,
			}}>
			{children}
		</AuthContext.Provider>
	);
}

// import and use useAuth() anywhere you want to reference or change Auth values.
export function useAuth()
{
	const context = useContext(AuthContext);
	if ( !context )
		throw new Error("useAuth() must be used within a AuthProvider");
	return context;
}
