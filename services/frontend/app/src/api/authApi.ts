import { apiRequest } from "./http";

export interface AuthUser
{
    id: number;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    is_guest: boolean;
    is_active: boolean;
    linked_providers: string[];
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
    username: string;
}

export interface UpdateUserRequest
{
    username?: string;
    display_name?: string | null;
    avatar_url?: string | null;
}

export interface PasswordUpdateRequest
{
    current_password?: string;
    new_password: string;
}

export function loginUser(credentials: LoginRequest): Promise<TokenResponse>
{
    return apiRequest<TokenResponse>(
        "/auth/login",
        {
            method: "POST",
            body: JSON.stringify(credentials),
        },
    );
}

export function registerUser(userData: RegisterRequest): Promise<AuthUser>
{
    return apiRequest<AuthUser>(
        "/auth/register",
        {
            method: "POST",
            body: JSON.stringify(userData),
        },
    );
}

export function getCurrentUser(accessToken: string): Promise<AuthUser>
{
    return apiRequest<AuthUser>(
        "/users/me",
        {},
        accessToken,
    );
}

export function loginWithGoogleCredentials(credential: string,): Promise<TokenResponse>
{
    return apiRequest<TokenResponse>(
        "/auth/google",
        {
            method: "POST",
            body: JSON.stringify({ credential }),
        },
    );
}

export function updateUser(userID: number, data: UpdateUserRequest, accessToken: string,): Promise<AuthUser>
{
    return apiRequest<AuthUser>(
        `/users/${userID}`,
        {
            method: "PUT",
            body: JSON.stringify(data),
        },
        accessToken,
    );
}

export function linkGoogleAccount(credential: string, accessToken: string,): Promise<AuthUser>
{
    return apiRequest<AuthUser>(
        "/auth/google/link",
        {
            method: "POST",
            body: JSON.stringify({ credential }),
        },
        accessToken,
    );
}

export function updatePassword(data: PasswordUpdateRequest, accessToken: string,): Promise<AuthUser>
{
    return apiRequest<AuthUser>(
        "/auth/password",
        {
            method: "PUT",
            body: JSON.stringify(data),
        },
        accessToken,
    );
}
