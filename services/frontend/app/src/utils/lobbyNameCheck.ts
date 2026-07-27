import { ErrorType } from "./errors";

function hasValidCharacters( str: string ) : boolean
{
	return /^[ a-zA-Z0-9_.-]+$/.test(str);
}

export const minLobbyNameLength = 3;
export const maxLobbyNameLength = 20;

export function getValidLobbyName( lobbyName: string ) : string | ErrorType
{
	const trimmedLobbyName = lobbyName.trim();

	if ( trimmedLobbyName.length === 0 )
		return ErrorType.lobbyNameCannotBeEmpty;
	if ( trimmedLobbyName.length < minLobbyNameLength || trimmedLobbyName.length > maxLobbyNameLength )
		return ErrorType.badLobbyNameLength;
	if ( !hasValidCharacters(trimmedLobbyName) )
		return ErrorType.lobbyNameContainsInvalChars;

	return trimmedLobbyName;
}
