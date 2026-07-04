export enum ErrorType
{
	none,
	usernameAlreadyTaken,
	usernameCannotBeEmpty,
	passwordsDontMatch,
	passwordCannotBeEmpty,
	incorrectCreds,
	avatarBadFileType,
	userDoesNotExist,
	userAlreadyFriend,
}

export function errorMsg( error: ErrorType ): string
{
	switch (error)
	{
		case ErrorType.usernameAlreadyTaken:
			return "Username already taken!";
		case ErrorType.usernameCannotBeEmpty:
			return "Username cannot be empty!";
		case ErrorType.passwordsDontMatch:
			return "Passwords don't match!";
		case ErrorType.passwordCannotBeEmpty:
			return "Password cannot be empty!";
		case ErrorType.incorrectCreds:
			return "Incorrect username or password!";
		case ErrorType.avatarBadFileType:
			return "Avatar must be JPEG or PNG!";
		case ErrorType.userDoesNotExist:
			return "User does not exist!";
		case ErrorType.userAlreadyFriend:
			return "User already in friends list!";
		default:
			return "";
	}
}

export enum MobilePosition
{
	top = "mobileTop",
	bottom = "mobileBottom",
}

