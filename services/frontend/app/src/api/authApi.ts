import { apiRequest } from "./http";

export interface AuthUser
{
    id: number;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    is_guest: boolean;
    is_active: boolean;
}

export interface TokenResponse
{
    access_token: string;
    token_type: string;
}

export interface LoginRequest
{
    email: string;
    password: string;
}

export interface RegisterRequest
{
    email: string;
    password: string;
    username?: string;
}

export function loginUser(credentials: LoginRequest): Promise<TokenResponse>
{
    return apiRequest<TokenResponse>("/auth/login",
        {
            method: "POST",
            body: JSON.stringify(credentials),
        });
}

export function registerUser(userData: RegisterRequest): Promise<AuthUser>
{
    return apiRequest<AuthUser>("/auth/register",
    {
        method: "POST",
        body: JSON.stringify(userData),
    });
}

export function getCurrentUser(accessToken: string): Promise<AuthUser>
{
	return apiRequest<AuthUser>(
		"/users/me",
		{},
		accessToken,
	);
}

export function loginWithGoogleCredentials(credential: string): Promise<TokenResponse>
{
    return apiRequest<TokenResponse>("/auth/google",
        {
            method: "POST",
            body: JSON.stringify({ credential }),
        });
}
