import { ErrorType } from "./errors";

function hasValidCharacters( str: string ) : boolean
{
	return /^[ a-zA-Z0-9_.-]+$/.test(str);
}

export const minLobbyNameLength = 3;
export const maxLobbyNameLength = 20;

export function getValidLobbyName( lobbyName: string ) : string | ErrorType
{
	const lbbyName = lobbyName.trim();

	if ( lbbyName.length === 0 )
		return ErrorType.lobbyNameCannotBeEmpty;
	if ( lbbyName.length < minLobbyNameLength || lbbyName.length > maxLobbyNameLength )
		return ErrorType.badLobbyNameLength;
	if ( !hasValidCharacters(lbbyName) )
		return ErrorType.lobbyNameContainsInvalChars;

	return lbbyName;
}
