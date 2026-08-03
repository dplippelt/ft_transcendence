import { ApiError } from "../api/http";

<<<<<<< HEAD

export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 50;

export const MIN_LOBBY_NAME_LENGTH = 3;
export const MAX_LOBBY_NAME_LENGTH = 50;

=======
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 50;
export const MIN_LOBBY_NAME_LENGTH = 3;
export const MAX_LOBBY_NAME_LENGTH = 50;
>>>>>>> master

export enum ErrorType
{
    none,
<<<<<<< HEAD

=======
>>>>>>> master
    usernameAlreadyTaken,
    emailAlreadyTaken,
    usernameCannotBeEmpty,
    badUsernameLength,
    usernameContainsInvalChars,
<<<<<<< HEAD
    usernameCannotBeTheSame,

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

    avatarBadFileType,

=======
    passwordsDontMatch,
    passwordCannotBeEmpty,
    incorrectCreds,
    accountInactive,
    registrationFailed,
    googleLoginFailed,
    googleLoginUnavailable,
    avatarBadFileType,
>>>>>>> master
    cannotAddSelf,
    userDoesNotExist,
    userAlreadyFriend,
    noFriendSelected,
<<<<<<< HEAD

=======
>>>>>>> master
    lobbyNameCannotBeEmpty,
    badLobbyNameLength,
    lobbyNameContainsInvalChars,
    lobbyNameAlreadyExists,
<<<<<<< HEAD
    lobbyDoesNotExist,
    lobbyFull,

=======
    usernameCannotBeTheSame,
    lobbyDoesNotExist,
    lobbyFull,
    invalidEmail,
    passwordTooShort,
    emailCannotBeEmpty,
>>>>>>> master
    unknown,
}


export function isErrorType(value: string | ErrorType,): value is ErrorType
{
    return typeof value === "number";
}


export function errorMsg(error: ErrorType): string
{
<<<<<<< HEAD
    switch (error)
    {
        case ErrorType.usernameAlreadyTaken:
            return "Username already taken!";
        case ErrorType.usernameCannotBeEmpty:
            return "Username cannot be empty!";
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
=======
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
>>>>>>> master
        case ErrorType.accountInactive:
            return "This account is inactive.";
        case ErrorType.registrationFailed:
            return "Failed to create account.";
        case ErrorType.googleLoginFailed:
            return "Google login failed.";
        case ErrorType.googleLoginUnavailable:
            return "Google login is currently unavailable.";
<<<<<<< HEAD
        case ErrorType.googleAccountNotLinked:
            return (
                "An account with this email already exists. " +
                "Sign in with email and password, then link " +
                "Google from your profile."
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
        case ErrorType.avatarBadFileType:
            return "Avatar must be JPEG or PNG!";
        case ErrorType.cannotAddSelf:
            return "You cannot add yourself as a friend!";
        case ErrorType.userDoesNotExist:
            return "User does not exist!";
        case ErrorType.userAlreadyFriend:
            return "User already in friends list!";
        case ErrorType.noFriendSelected:
            return "Select a friend to invite";
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
                    return ErrorType.passwordTooShort;
                case "username":
                    return ErrorType.badUsernameLength;
            }
        }
    }

    return ErrorType.unknown;
=======
        case ErrorType.invalidEmail:
            return "Please enter a valid email address!";
        case ErrorType.passwordTooShort:
            return "Password must be at least 8 characters long!";
        case ErrorType.emailCannotBeEmpty:
            return "Email cannot be empty!";
		default:
			return "";
	}
>>>>>>> master
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
