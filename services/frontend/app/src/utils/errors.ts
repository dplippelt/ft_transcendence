import { maxLobbyNameLength, minLobbyNameLength } from "./lobbyNameCheck";
import { maxUsernameLength, minUserNameLength } from "./usernameCheck";

export enum ErrorType
{
	none,
	usernameAlreadyTaken,
	usernameCannotBeEmpty,
	badUserNameLength,
	usernameContainsInvalChars,
	passwordsDontMatch,
	passwordCannotBeEmpty,
	incorrectCreds,
	avatarBadFileType,
	cannotAddSelf,
	userDoesNotExist,
	userAlreadyFriend,
	noFriendSelected,
	lobbyNameCannotBeEmpty,
	badLobbyNameLength,
	lobbyNameContainsInvalChars,
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
		case ErrorType.badUserNameLength:
			return "Username must be between " + minUserNameLength + " and " + maxUsernameLength + " characters long!";
		case ErrorType.usernameContainsInvalChars:
			return "Username may only contain letters, numbers and the symbols _ . -";
		case ErrorType.passwordsDontMatch:
			return "Passwords don't match!";
		case ErrorType.passwordCannotBeEmpty:
			return "Password cannot be empty!";
		case ErrorType.incorrectCreds:
			return "Incorrect username or password!";
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
		case ErrorType.badUserNameLength:
			return "Lobby name must be between " + minLobbyNameLength + " and " + maxLobbyNameLength + " characters long!";
		case ErrorType.usernameContainsInvalChars:
			return "Lobby name may only contain letters, numbers, spaces and the symbols _ . -";
		default:
			return "";
	}
}
