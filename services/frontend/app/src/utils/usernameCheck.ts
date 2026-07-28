import { ErrorType, MAX_USERNAME_LENGTH, MIN_USERNAME_LENGTH } from "./errors";

function hasValidCharacters( str: string ) : boolean
{
	return /^[a-zA-Z0-9_.-]+$/.test(str);
}

export function getValidUsername( username: string ) : string | ErrorType
{
	const trimmedUsername = username.trim();

	if ( trimmedUsername.length === 0 )
		return ErrorType.usernameCannotBeEmpty;
	if ( trimmedUsername.length < MIN_USERNAME_LENGTH || trimmedUsername.length > MAX_USERNAME_LENGTH )
		return ErrorType.badUsernameLength;
	if ( !hasValidCharacters(trimmedUsername) )
		return ErrorType.usernameContainsInvalChars;

	return trimmedUsername;
}
