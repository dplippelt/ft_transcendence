import { ApiError } from "../api/http";


export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 50;

export const MIN_LOBBY_NAME_LENGTH = 3;
export const MAX_LOBBY_NAME_LENGTH = 50;


export enum ErrorType
{
    none,
    usernameAlreadyTaken,
    emailAlreadyTaken,
    usernameCannotBeEmpty,
    badUsernameLength,
    usernameContainsInvalChars,
    usernameCannotBeTheSame,
    usernameRequired,

    passwordsDontMatch,
    passwordCannotBeEmpty,
    passwordTooShort,

    emailCannotBeEmpty,
    invalidEmail,

    incorrectCreds,
    accountInactive,
    registrationFailed,

    googleLoginFailed,
    googleLoginUnavailable,
    googleAccountNotLinked,
    googleAccountAlreadyLinked,
    googleProviderAlreadyLinked,
    googleLinkFailed,
    googleRegistrationFailed,
    googleEmailConflict,
    googleUnlinkRequiresPassword,
    googleUnlinkFailed,

    avatarBadFileType,

    cannotAddSelf,
    cannotRemoveSelf,
    userDoesNotExist,
    userAlreadyFriend,
    noFriendSelected,
    friendRequestAlreadySent,
    friendRequestNotFound,
    friendRequestNotPending,
    friendshipNotFound,
    lobbyNameCannotBeEmpty,
    badLobbyNameLength,
    lobbyNameContainsInvalChars,
    lobbyNameAlreadyExists,
    lobbyDoesNotExist,
    lobbyFull,

    currentPasswordRequired,
    invalidCurrentPassword,
    passwordEmailUnavailable,
    passwordUpdateFailed,
    passwordSameAsCurrent,

    unknown,
}


export function isErrorType(value: string | ErrorType,): value is ErrorType
{
    return typeof value === "number";
}


export function errorMsg(error: ErrorType): string
{
    switch (error)
    {
        case ErrorType.usernameAlreadyTaken:
            return "Username already taken!";
        case ErrorType.usernameCannotBeEmpty:
            return "Username cannot be empty!";
        case ErrorType.usernameRequired:
            return "Choose a username before continuing.";
        case ErrorType.badUsernameLength:
            return (
                "Username must be between " +
                MIN_USERNAME_LENGTH +
                " and " +
                MAX_USERNAME_LENGTH +
                " characters long!"
            );
        case ErrorType.usernameContainsInvalChars:
            return (
                "Username may only contain letters, numbers " +
                "and the symbols _ . -"
            );
        case ErrorType.usernameCannotBeTheSame:
            return (
                "Username must be different from " +
                "Player 1's username"
            );
        case ErrorType.passwordsDontMatch:
            return "Passwords don't match!";
        case ErrorType.passwordCannotBeEmpty:
            return "Password cannot be empty!";
        case ErrorType.passwordTooShort:
            return "Password must be at least 8 characters long!";
        case ErrorType.emailCannotBeEmpty:
            return "Email cannot be empty!";
        case ErrorType.invalidEmail:
            return "Please enter a valid email address!";
        case ErrorType.emailAlreadyTaken:
            return "Email already registered!";
        case ErrorType.incorrectCreds:
            return "Incorrect email or password!";
        case ErrorType.accountInactive:
            return "This account is inactive.";
        case ErrorType.registrationFailed:
            return "Failed to create account.";
        case ErrorType.googleLoginFailed:
            return "Google login failed.";
        case ErrorType.googleLoginUnavailable:
            return "Google login is currently unavailable.";
        case ErrorType.googleAccountNotLinked:
            return (
                "Google is not linked to this account. " +
                "Sign in with your email and password, then " +
                "link Google again from your profile."
        );
        case ErrorType.googleAccountAlreadyLinked:
            return (
                "This Google account is already linked " +
                "to another user."
            );
        case ErrorType.googleProviderAlreadyLinked:
            return (
                "A Google account is already linked " +
                "to this profile."
            );
        case ErrorType.googleLinkFailed:
            return "Failed to link the Google account.";
        case ErrorType.googleRegistrationFailed:
            return "Failed to create an account with Google.";
        case ErrorType.googleEmailConflict:
            return (
                "A Google account with this email is already " +
                "registered under a different Google identity."
            );
        case ErrorType.googleUnlinkRequiresPassword:
            return "Password is required to unlink Google account.";
        case ErrorType.googleUnlinkFailed:
            return "Failed to unlink Google account.";
        case ErrorType.avatarBadFileType:
            return "Avatar must be JPEG or PNG!";
        case ErrorType.cannotAddSelf:
            return "You cannot add yourself as a friend!";
        case ErrorType.cannotRemoveSelf:
            return "You cannot remove yourself as a friend!";
        case ErrorType.userDoesNotExist:
            return "User does not exist!";
        case ErrorType.userAlreadyFriend:
            return "User already in friends list!";
        case ErrorType.noFriendSelected:
            return "Select a friend to invite";
        case ErrorType.friendRequestAlreadySent:
            return "Friend request already sent!";
        case ErrorType.friendRequestNotFound:
            return "This friend request no longer exists.";
        case ErrorType.friendRequestNotPending:
            return "This friend request has already been handled.";
        case ErrorType.friendshipNotFound:
            return "You are not friends with this user.";
        case ErrorType.lobbyNameCannotBeEmpty:
            return "Lobby name cannot be empty!";
        case ErrorType.badLobbyNameLength:
            return (
                "Lobby name must be between " +
                MIN_LOBBY_NAME_LENGTH +
                " and " +
                MAX_LOBBY_NAME_LENGTH +
                " characters long!"
            );
        case ErrorType.lobbyNameContainsInvalChars:
            return (
                "Lobby name may only contain letters, numbers, " +
                "spaces and the symbols _ . -"
            );
        case ErrorType.lobbyNameAlreadyExists:
            return "A lobby with this name already exists!";
        case ErrorType.lobbyDoesNotExist:
            return "Failed to join because the lobby does not exist";
        case ErrorType.lobbyFull:
            return "Failed to join because the lobby is full";
        case ErrorType.currentPasswordRequired:
            return "Current password is required.";
        case ErrorType.invalidCurrentPassword:
            return "Current password is incorrect.";
        case ErrorType.passwordEmailUnavailable:
            return "No verified email is available for this account.";
        case ErrorType.passwordUpdateFailed:
            return "Failed to update password.";
        case ErrorType.passwordSameAsCurrent:
            return "New password must be different from your current password.";
        case ErrorType.unknown:
            return "Something went wrong!";
        default:
            return "";
    }
}


export function mapAuthApiError(error: unknown): ErrorType
{
    if (!(error instanceof ApiError))
        return ErrorType.unknown;

    switch (error.code)
    {
        case "INVALID_CREDENTIALS":
            return ErrorType.incorrectCreds;
        case "EMAIL_ALREADY_EXISTS":
            return ErrorType.emailAlreadyTaken;
        case "USERNAME_ALREADY_EXISTS":
            return ErrorType.usernameAlreadyTaken;
        case "USERNAME_REQUIRED":
            return ErrorType.usernameRequired;
        case "ACCOUNT_INACTIVE":
            return ErrorType.accountInactive;
        case "REGISTRATION_FAILED":
            return ErrorType.registrationFailed;
        case "GOOGLE_NOT_CONFIGURED":
            return ErrorType.googleLoginUnavailable;
        case "INVALID_GOOGLE_CREDENTIALS":
        case "GOOGLE_SUBJECT_MISSING":
        case "GOOGLE_EMAIL_MISSING":
        case "GOOGLE_EMAIL_NOT_VERIFIED":
            return ErrorType.googleLoginFailed;
        case "GOOGLE_ACCOUNT_NOT_LINKED":
            return ErrorType.googleAccountNotLinked;
        case "GOOGLE_ACCOUNT_ALREADY_LINKED":
            return ErrorType.googleAccountAlreadyLinked;
        case "GOOGLE_PROVIDER_ALREADY_LINKED":
            return ErrorType.googleProviderAlreadyLinked;
        case "GOOGLE_LINK_FAILED":
            return ErrorType.googleLinkFailed;
        case "GOOGLE_REGISTRATION_FAILED":
            return ErrorType.googleRegistrationFailed;
        case "GOOGLE_EMAIL_CONFLICT":
            return ErrorType.googleEmailConflict;
        case "PASSWORD_REQUIRED_TO_UNLINK_GOOGLE":
            return ErrorType.googleUnlinkRequiresPassword;
        
        case "GOOGLE_UNLINK_FAILED":
            return ErrorType.googleUnlinkFailed;
        case "PASSWORD_REQUIRED":
            return ErrorType.currentPasswordRequired;
        case "INVALID_CURRENT_PASSWORD":
            return ErrorType.invalidCurrentPassword;
        case "PASSWORD_EMAIL_UNAVAILABLE":
            return ErrorType.passwordEmailUnavailable;
        case "PASSWORD_UPDATE_FAILED":
            return ErrorType.passwordUpdateFailed;
        case "PASSWORD_SAME_AS_CURRENT":
            return ErrorType.passwordSameAsCurrent;
    }
    if (error.status === 422 && error.validationErrors)
    {
        for (const validationError of error.validationErrors)
        {
            const field = validationError.loc?.[validationError.loc.length - 1];

            switch (field)
            {
                case "email":
                    return ErrorType.invalidEmail;
                case "password":
                case "new_password":
                    return ErrorType.passwordTooShort;
                case "username":
                    return ErrorType.badUsernameLength;
            }
        }
    }

    return ErrorType.unknown;
}

export function mapFriendsApiError(error: unknown): ErrorType
{
    if (!(error instanceof ApiError))
        return ErrorType.unknown;

    switch (error.code)
    {
        case "USER_NOT_FOUND":
            return ErrorType.userDoesNotExist;
        case "CANNOT_ADD_SELF":
            return ErrorType.cannotAddSelf;
        case "CANNOT_REMOVE_SELF":
            return ErrorType.cannotRemoveSelf;
        case "ALREADY_FRIENDS":
            return ErrorType.userAlreadyFriend;
        case "FRIEND_REQUEST_ALREADY_SENT":
            return ErrorType.friendRequestAlreadySent;
        case "FRIEND_REQUEST_NOT_FOUND":
            return ErrorType.friendRequestNotFound;
        case "FRIEND_REQUEST_NOT_PENDING":
            return ErrorType.friendRequestNotPending;
        case "FRIENDSHIP_NOT_FOUND":
            return ErrorType.friendshipNotFound;
    }
    return ErrorType.unknown;
}
