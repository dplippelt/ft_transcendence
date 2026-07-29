import { ApiError } from "../api/http";

export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 20;
export const MIN_LOBBY_NAME_LENGTH = 3;
export const MAX_LOBBY_NAME_LENGTH = 20;

export enum ErrorType
{
    none,
    usernameAlreadyTaken,
    emailAlreadyTaken,
    usernameCannotBeEmpty,
    badUsernameLength,
    usernameContainsInvalChars,
    passwordsDontMatch,
    passwordCannotBeEmpty,
    incorrectCreds,
    accountInactive,
    registrationFailed,
    googleLoginFailed,
    googleLoginUnavailable,
    avatarBadFileType,
    cannotAddSelf,
    userDoesNotExist,
    userAlreadyFriend,
    noFriendSelected,
    friendRequestAlreadySent,
    friendRequestNotFound,
    friendshipNotFound,
    lobbyNameCannotBeEmpty,
    badLobbyNameLength,
    lobbyNameContainsInvalChars,
    lobbyNameAlreadyExists,
    usernameCannotBeTheSame,
    lobbyDoesNotExist,
    lobbyFull,
    invalidEmail,
    passwordTooShort,
    unknown,
}

export function isErrorType( value: string | ErrorType ) : value is ErrorType
{
	return typeof value === "number";
}

export function errorMsg( error: ErrorType ): string
{
	switch (error)
	{
		case ErrorType.usernameAlreadyTaken:
			return "Username already taken!";
		case ErrorType.usernameCannotBeEmpty:
			return "Username cannot be empty!";
		case ErrorType.badUsernameLength:
			return "Username must be between " + MIN_USERNAME_LENGTH + " and " + MAX_USERNAME_LENGTH + " characters long!";
		case ErrorType.usernameContainsInvalChars:
			return "Username may only contain letters, numbers and the symbols _ . -";
		case ErrorType.passwordsDontMatch:
			return "Passwords don't match!";
		case ErrorType.passwordCannotBeEmpty:
			return "Password cannot be empty!";
		case ErrorType.incorrectCreds:
			return "Incorrect email or password!";
		case ErrorType.avatarBadFileType:
			return "Avatar must be JPEG or PNG!";
		case ErrorType.cannotAddSelf:
			return "You cannot add yourself as a friend!"
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
		case ErrorType.friendshipNotFound:
			return "You are not friends with this user.";
		case ErrorType.lobbyNameCannotBeEmpty:
			return "Lobby name cannot be empty!";
		case ErrorType.badLobbyNameLength:
			return "Lobby name must be between " + MIN_LOBBY_NAME_LENGTH + " and " + MAX_LOBBY_NAME_LENGTH + " characters long!";
		case ErrorType.lobbyNameContainsInvalChars:
			return "Lobby name may only contain letters, numbers, spaces and the symbols _ . -";
		case ErrorType.lobbyNameAlreadyExists:
			return "A lobby with this name already exists!";
		case ErrorType.usernameCannotBeTheSame:
			return "Username must be different from Player 1's username";
		case ErrorType.lobbyDoesNotExist:
			return "Failed to join because the lobby does not exist";
		case ErrorType.lobbyFull:
            return "Failed to join because the lobby is full";
        case ErrorType.emailAlreadyTaken:
            return "Email already registered!";
        case ErrorType.unknown:
            return "Something went wrong!";
        case ErrorType.accountInactive:
            return "This account is inactive.";
        case ErrorType.registrationFailed:
            return "Failed to create account.";
        case ErrorType.googleLoginFailed:
            return "Google login failed.";
        case ErrorType.googleLoginUnavailable:
            return "Google login is currently unavailable.";
        case ErrorType.invalidEmail:
            return "Please enter a valid email address!";
        case ErrorType.passwordTooShort:
            return "Password must be at least 8 characters long!";
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
        case "GOOGLE_LINK_FAILED":
        case "GOOGLE_REGISTRATION_FAILED":
            return ErrorType.googleLoginFailed;
    }
    if (error.status === 422 && error.validationErrors)
    {
        for (const validationError of error.validationErrors)
        {
            const field =
                validationError.loc?.[validationError.loc.length - 1];

            switch (field)
            {
                case "email":
                    return ErrorType.invalidEmail;

                case "password":
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
        case "ALREADY_FRIENDS":
            return ErrorType.userAlreadyFriend;
        case "FRIEND_REQUEST_ALREADY_SENT":
            return ErrorType.friendRequestAlreadySent;
        case "FRIEND_REQUEST_NOT_FOUND":
            return ErrorType.friendRequestNotFound;
        case "FRIENDSHIP_NOT_FOUND":
            return ErrorType.friendshipNotFound;
    }
    return ErrorType.unknown;
}
