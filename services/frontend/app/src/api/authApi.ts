import { apiRequest } from "./http";

export interface AuthUser
{
    id: number;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    is_guest: boolean;
    is_active: boolean;
    two_factor_enabled: boolean;
    linked_providers: string[];
}

export interface TokenResponse
{
    access_token: string;
    token_type: string;
}

export interface TwoFactorAuthResponse
{
    requires_two_factor: true;
    challenge_token: string;
}

export interface TwoFactorSetupRequest
{
    current_password?: string;
    google_credential?: string;
}

export interface TwoFactorSetupResponse
{
    provisioning_uri: string;
}

export interface TwoFactorCodeRequest
{
    code: string;
}

export interface TwoFactorConfirmResponse
{
    user: AuthUser;
    recovery_codes: string[];
}

export type LoginResponse = TokenResponse | TwoFactorAuthResponse;

export interface TwoFactorLoginRequest
{
    challenge_token: string;
    code: string;
}

export interface TwoFactorRecoveryRequest
{
    challenge_token: string;
    recovery_code: string;
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
}

export interface PasswordUpdateRequest
{
    current_password?: string;
    new_password: string;
}

export function loginUser(credentials: LoginRequest): Promise<LoginResponse>
{
    return apiRequest<LoginResponse>(
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

export function loginWithGoogleCredentials(credential: string,): Promise<LoginResponse>
{
    return apiRequest<LoginResponse>(
        "/auth/google",
        {
            method: "POST",
            body: JSON.stringify({ credential }),
        },
    );
}

export function loginWithTwoFactor(data: TwoFactorLoginRequest): Promise<TokenResponse>
{
    return apiRequest<TokenResponse>(
        "/auth/2fa/login",
        {
            method: "POST",
            body: JSON.stringify(data),
        },
    );
}

export function loginWithRecoveryCode(data: TwoFactorRecoveryRequest): Promise<TokenResponse>
{
    return apiRequest<TokenResponse>(
        "/auth/2fa/recovery",
        {
            method: "POST",
            body: JSON.stringify(data),
        },
    );
}

export function updateUser(data: UpdateUserRequest, accessToken: string,): Promise<AuthUser>
{
    return apiRequest<AuthUser>(
        `/users/me`,
        {
            method: "PATCH",
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

export function unlinkGoogleAccount(accessToken: string,): Promise<AuthUser>
{
    return apiRequest<AuthUser>(
        "/auth/google/link",
        {
            method: "DELETE",
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

export function updateAvatar(userID: number, avatar: File, accessToken: string,): Promise<AuthUser>
{
    const formData = new FormData();
    formData.append("avatar", avatar);

    return apiRequest<AuthUser>(
        `/users/${userID}/avatar`,
        {
            method: "PUT",
            body: formData,
        },
        accessToken,
    );
}

export function setupTwoFactor(data: TwoFactorSetupRequest, accessToekn: string,): Promise<TwoFactorSetupResponse>
{
    return apiRequest<TwoFactorSetupResponse>(
        "/auth/2fa/setup",
        {
            method: "POST",
            body: JSON.stringify(data),
        },
        accessToekn,
    );
}

export function confirmTwoFactor(data: TwoFactorCodeRequest, accessToken: string,): Promise<TwoFactorConfirmResponse>
{
    return apiRequest<TwoFactorConfirmResponse>(
        "/auth/2fa/confirm",
        {
            method: "POST",
            body: JSON.stringify(data),
        },
        accessToken,
    );
}
