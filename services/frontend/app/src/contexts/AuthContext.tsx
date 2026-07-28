import {createContext, useContext, useEffect, useCallback, useMemo, useState,} from "react";
import type { ReactNode } from "react";

import {getCurrentUser, loginUser, loginWithGoogleCredentials, registerUser,} from "../api/authApi";

import type {AuthUser, LoginRequest, RegisterRequest,} from "../api/authApi";

const ACCESS_TOKEN_KEY = "accessToken";

type AuthStatus =
	| "loading"
	| "authenticated"
    | "unauthenticated";

export interface IAuth
{
    guest: boolean;
    accessToken: string | null;
    user: AuthUser | null;
    status: AuthStatus;
}

interface IAuthContext
{
	auth: IAuth;
	login: (credentials: LoginRequest) => Promise<void>;
	register: (userData: RegisterRequest) => Promise<void>;
	loginWithGoogle: (credential: string) => Promise<void>;
	refreshUser: () => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<IAuthContext | null>(null);


export default function AuthProvider( { children } : {children: ReactNode} )
{
    const [accessToken, setAccessToken] = useState<string | null>(() =>
		localStorage.getItem(ACCESS_TOKEN_KEY),
	);

    const [user, setUser] = useState<AuthUser | null>(null);
    const [status, setStatus] = useState<AuthStatus>("loading");

    const logout = useCallback(() => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        setAccessToken(null);
        setUser(null);
        setStatus("unauthenticated");
    }, []);

    const establishSession = useCallback(async (token: string) => 
    {
        setStatus("loading");

        try
        {
            const currentUser = await getCurrentUser(token);

            localStorage.setItem(ACCESS_TOKEN_KEY, token);
            setAccessToken(token);
            setUser(currentUser);
            setStatus("authenticated");
        }
        catch (error)
        {
            logout();
            throw error;
        }
    }, [logout]);

    const login = useCallback(async (credentials: LoginRequest) =>
    {
        const tokenResponse = await loginUser(credentials);

        await establishSession(tokenResponse.access_token);
    }, [establishSession]);

    const register = useCallback(async (userData: RegisterRequest) =>
    {
        await registerUser(userData);

        await login({
            email: userData.email,
            password: userData.password,
        });
    }, [login]);

    const loginWithGoogle = useCallback(async (credential: string) =>
    {
        const tokenResponse = await loginWithGoogleCredentials(credential);

        await establishSession(tokenResponse.access_token);
    }, [establishSession]);

    const refreshUser = useCallback(async () =>
    {
        if (!accessToken)
            throw new Error("No authenticated session");
        const currentUser = await getCurrentUser(accessToken);
        setUser(currentUser);
    }, [accessToken]);

    useEffect(() =>
    {
        const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (!storedToken)
        {
            setStatus("unauthenticated");
            return;
        }

        void establishSession(storedToken).catch(() => {
            // TODO: establishSession clears invalid session.
        });
    }, [establishSession]);

    const auth = useMemo(() => ({
        guest: user === null,
        accessToken,
        user,
        status,
    }), [accessToken, user, status]);

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
				auth,
				login,
				register,
				loginWithGoogle,
				refreshUser,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

// import and use useAuth() anywhere you want to reference or change Auth values.
export function useAuth(): IAuthContext
{
	const context = useContext(AuthContext);

	if (!context)
		throw new Error("useAuth() must be used within AuthProvider");

	return context;
}
