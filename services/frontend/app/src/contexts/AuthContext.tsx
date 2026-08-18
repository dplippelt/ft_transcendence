import {createContext, useContext, useEffect, useCallback, useState,} from "react";
import type { ReactNode } from "react";

import {getCurrentUser, linkGoogleAccount, loginUser, loginWithGoogleCredentials, registerUser, updateUser, updatePassword as updatePasswordRequest} from "../api/authApi";

import type { AuthUser, LoginRequest, RegisterRequest, UpdateUserRequest, PasswordUpdateRequest} from "../api/authApi";
import { ApiError } from "../api/http";

const ACCESS_TOKEN_KEY = "accessToken";

type AuthStatus =
	| "loading"
	| "authenticated"
	| "unauthenticated"
	| "error";

export interface IAuth
{
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
    updateProfile: (data: UpdateUserRequest) => Promise<void>;
    updatePassword: (data: PasswordUpdateRequest) => Promise<void>;
    linkGoogle: (credential: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<IAuthContext | null>(null);

export function useCurrentUser(): AuthUser
{
	const { auth } = useAuth();

	if (!auth.user)
		throw new Error("useCurrentUser() requires an authenticated user");

	return auth.user;
}

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

    // expired/invalid token/inactive account -> logout, network/backend 500/temporary restart -> preserve token
    const establishSession = useCallback(async (token: string) => 
    {
        setStatus("loading");

        localStorage.setItem(ACCESS_TOKEN_KEY, token);
        setAccessToken(token);

        try
        {
            const currentUser = await getCurrentUser(token);
            setUser(currentUser);
            setStatus("authenticated");
        }
        catch (error)
        {
            if (error instanceof ApiError && (error.status === 401 || error.status === 403))
                logout();
            else
                setStatus("error");
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

    useEffect(() =>
    {
        const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (!storedToken)
        {
            setStatus("unauthenticated");
            return;
        }

        void establishSession(storedToken).catch(() => {
            // Auth state is handled by establishSession.
        });
    }, [establishSession]);

    const auth: IAuth = {accessToken, user,status,};
    
    const updateProfile = useCallback(async (data: UpdateUserRequest) =>
    {
        if (!accessToken || !user)
            throw new Error("No authenticated session");
    
        const updatedUser = await updateUser(
            data,
            accessToken,
        );
    
        setUser(updatedUser);
    }, [accessToken, user]);
    
    const linkGoogle = useCallback(async (credential: string) =>
    {
        if (!accessToken)
            throw new Error("No authenticated session");
        const updatedUser = await linkGoogleAccount(
            credential,
            accessToken,
        );
        setUser(updatedUser);
    }, [accessToken]);

    const refreshUser = useCallback(async () =>
        {
            if (!accessToken)
                return;
            const refreshedUser = await getCurrentUser(accessToken,);
            setUser(refreshedUser);
        }, [accessToken]);

    const updatePassword = useCallback(async (data: PasswordUpdateRequest) =>
    {
        if (!accessToken)
            throw new Error("No authenticated session");
        try
        {
            const updatedUser = await updatePasswordRequest(
                data,
                accessToken,
            );
    
            setUser(updatedUser);
        }
        catch (error)
        {
            if (error instanceof ApiError && (error.code === "PASSWORD_ALREADY_SET"))
            {
                await refreshUser();
            }
            throw error;
        }
    }, [accessToken, refreshUser]);


	return (
		<AuthContext.Provider
			value=
			{{
				auth,
				login,
				register,
                loginWithGoogle,
                linkGoogle,
				logout,
                updateProfile,
                updatePassword,
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
