export enum AccountError
{
	none,
	usernameAlreadyTaken,
	usernameCannotBeEmpty,
	passwordsDontMatch,
	passwordCannotBeEmpty,
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
		case AccountError.avatarBadFileType:
			return "Avatar must be JPEG or PNG!";
		default:
			return "";
	}
}
