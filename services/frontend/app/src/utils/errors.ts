export enum AccountError
{
	none,
	usernameAlreadyTaken,
	usernameCannotBeEmpty,
	passwordsDontMatch,
	passwordCannotBeEmpty,
	incorrectCreds,
	avatarBadFileType,
}

export function errorMsg( error: AccountError ): string
{
	switch (error)
	{
		case AccountError.usernameAlreadyTaken:
			return "Username already taken!";
		case AccountError.usernameCannotBeEmpty:
			return "Username cannot be empty!";
		case AccountError.passwordsDontMatch:
			return "Passwords don't match!";
		case AccountError.passwordCannotBeEmpty:
			return "Password cannot be empty!";
		case AccountError.incorrectCreds:
			return "Incorrect username or password!";
		case AccountError.avatarBadFileType:
			return "Avatar must be JPEG or PNG!";
		default:
			return "";
	}
}
