import { ErrorType, MAX_LOBBY_NAME_LENGTH, MIN_LOBBY_NAME_LENGTH } from "./errors";

function hasValidCharacters( str: string ) : boolean
{
	return /^[ a-zA-Z0-9_.-]+$/.test(str);
}

export function getValidLobbyName( lobbyName: string ) : string | ErrorType
{
	const trimmedLobbyName = lobbyName.trim();

	if ( trimmedLobbyName.length === 0 )
		return ErrorType.lobbyNameCannotBeEmpty;
	if ( trimmedLobbyName.length < MIN_LOBBY_NAME_LENGTH || trimmedLobbyName.length > MAX_LOBBY_NAME_LENGTH )
		return ErrorType.badLobbyNameLength;
	if ( !hasValidCharacters(trimmedLobbyName) )
		return ErrorType.lobbyNameContainsInvalChars;

	return trimmedLobbyName;
}
