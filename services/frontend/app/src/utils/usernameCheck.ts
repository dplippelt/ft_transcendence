import { ErrorType } from "./utils";

function hasValidCharacters( str: string ) : boolean
{
	return /^[a-zA-Z0-9_.-]+$/.test(str);
}

export function isErrorType( value: string | ErrorType ) : value is ErrorType
{
	return typeof value === "number";
}

export function getValidUsername( username: string ) : string | ErrorType
{
	const usrname = username.trim();

	if ( usrname.length === 0 )
		return ErrorType.usernameCannotBeEmpty;
	if ( !hasValidCharacters(usrname) )
		return ErrorType.usernameContainsInvalChars

	return usrname;
}
