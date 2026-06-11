import { createContext, useContext, /* useEffect, */ useState } from "react";
import type { ReactNode } from "react";

export type AccountContextType =
{
	account: Account,
	setAccount: React.Dispatch<React.SetStateAction<Account>>,
}

export type Account =
{
	// define data type for each Account value
	guest: boolean,
	username: string,
	password: string,
	avatar: string,
}

const AccountContext = createContext<AccountContextType | null>(null);

export const defaultAccount: Account =
{
	// define default Account values
	guest: true,
	username: "Guest",
	password: "guestPass",
	avatar: "/src/assets/guest_avatar_test.jpg",
};

export default function AccountProvider( { children } : {children: ReactNode} )
{
	const [account, setAccount] = useState<Account>(defaultAccount);

	// mock template for later when loading accout info from database after login (e.g. when user hits F5 to reload page)
	// at the moment when you hit F5 everything is rerendered and account info will be set to default again.
	// turn it into a custom hook because it also needs to be called in the login / signup button handler after a succesful login/sign-up

	// useEffect(() =>
	// {
	// 	async function loadAccount()
	// 	{
	// 		const sessionToken = localStorage.getItem("sessionToken");
	// 		if (await isValidToken(sessionToken))
	// 			setAccount(await fetchDbAccount(sessionToken));
	// 	}
	// 	loadAccount();
	// }, []);

	return (
		<AccountContext.Provider
			value=
			{{
				account, setAccount,
			}}>
			{children}
		</AccountContext.Provider>
	);
}

// import and use useAccount() anywhere you want to reference or change Account values.
export function useAccount()
{
	return useContext(AccountContext)!;
}
