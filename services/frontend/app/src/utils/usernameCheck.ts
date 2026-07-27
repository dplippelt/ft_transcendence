import { ErrorType } from "./errors";

function hasValidCharacters( str: string ) : boolean
{
	return /^[a-zA-Z0-9_.-]+$/.test(str);
}

export const minUserNameLength = 3;
export const maxUsernameLength = 20;

export function getValidUsername( username: string ) : string | ErrorType
{
	const trimmedUsername = username.trim();

	if ( trimmedUsername.length === 0 )
		return ErrorType.usernameCannotBeEmpty;
	if ( trimmedUsername.length < minUserNameLength || trimmedUsername.length > maxUsernameLength )
		return ErrorType.badUserNameLength;
	if ( !hasValidCharacters(trimmedUsername) )
		return ErrorType.usernameContainsInvalChars;

	return trimmedUsername;
}
