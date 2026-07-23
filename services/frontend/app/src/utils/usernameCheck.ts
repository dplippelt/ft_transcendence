import { ErrorType } from "./errors";

function hasValidCharacters( str: string ) : boolean
{
	return /^[a-zA-Z0-9_.-]+$/.test(str);
}

export const minUserNameLength = 3;
export const maxUsernameLength = 20;

export function getValidUsername( username: string ) : string | ErrorType
{
	const usrname = username.trim();

	if ( usrname.length === 0 )
		return ErrorType.usernameCannotBeEmpty;
	if ( usrname.length < minUserNameLength || usrname.length > maxUsernameLength )
		return ErrorType.badUserNameLength;
	if ( !hasValidCharacters(usrname) )
		return ErrorType.usernameContainsInvalChars;

	return usrname;
}
