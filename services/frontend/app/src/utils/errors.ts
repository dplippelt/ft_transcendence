export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 20;
export const MIN_LOBBY_NAME_LENGTH = 3;
export const MAX_LOBBY_NAME_LENGTH = 20;

export enum ErrorType
{
	none,
	usernameAlreadyTaken,
	usernameCannotBeEmpty,
	badUsernameLength,
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
	lobbyNameAlreadyExists,
	usernameCannotBeTheSame,
	lobbyDoesNotExist,
	lobbyFull,
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
		default:
			return "";
	}
}
