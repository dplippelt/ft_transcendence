import { createContext, useContext, /* useEffect, */ useState } from "react";
import type { ReactNode } from "react";
import type { IChatMsg } from "./ChatHistoryContext";
import { ErrorType } from "../utils/errors";

export interface LobbyData
{
	lobbyName: string;
	hostID: string;
	guestID: guestID;
	chatHistory: IChatMsg[];
}

type lobbyID = string;
type guestID = string | null;
type Lobbies = Record<lobbyID, LobbyData>;

const defaultLobbies: Lobbies =
{
	"lobbyID_1": { lobbyName: "Lobby 1", hostID: "hostID_1", guestID: "guestID_1", chatHistory: [] },
	"lobbyID_2": { lobbyName: "Lobby 2", hostID: "hostID_2", guestID: null, chatHistory: [] },
	"lobbyID_3": { lobbyName: "Lobby 3", hostID: "hostID_3", guestID: null, chatHistory: [] },
	"lobbyID_4": { lobbyName: "Lobby 4", hostID: "hostID_4", guestID: "guestID_4", chatHistory: [] },
	"lobbyID_5": { lobbyName: "Lobby 5", hostID: "hostID_5", guestID: null, chatHistory: [] },
	"lobbyID_6": { lobbyName: "Lobby 6", hostID: "hostID_6", guestID: null, chatHistory: [] },
	"lobbyID_7": { lobbyName: "Lobby 7", hostID: "hostID_7", guestID: "guestID_7", chatHistory: [] },
	"lobbyID_8": { lobbyName: "Lobby 8", hostID: "hostID_8", guestID: null, chatHistory: [] },
	"lobbyID_9": { lobbyName: "Lobby 9", hostID: "hostID_9", guestID: null, chatHistory: [] },
	"lobbyID_10": { lobbyName: "Lobby 10", hostID: "hostID_10", guestID: "guestID_10", chatHistory: [] },
	"lobbyID_11": { lobbyName: "Lobby 11", hostID: "hostID_11", guestID: null, chatHistory: [] },
	"lobbyID_12": { lobbyName: "Lobby 12", hostID: "hostID_12", guestID: null, chatHistory: [] },
	"lobbyID_13": { lobbyName: "Lobby 13", hostID: "hostID_13", guestID: "guestID_13", chatHistory: [] },
	"lobbyID_14": { lobbyName: "Lobby 14", hostID: "hostID_14", guestID: null, chatHistory: [] },
	"lobbyID_15": { lobbyName: "Lobby 15", hostID: "hostID_15", guestID: null, chatHistory: [] },
	"lobbyID_16": { lobbyName: "Lobby with really long name, it just keeps going and going and going and going", hostID: "hostID_15", guestID: null, chatHistory: [] },
}

interface ILobbiesContext
{
	lobbies: Lobbies;
	resetLobbies: () => void;
	refreshLobbies: () => void;
	createLobby: ( lobbyID: lobbyID, hostID: string, lobbyName: string ) => void;
	closeLobby: ( lobbyID: lobbyID ) => void;
	joinLobby: ( lobbyID: lobbyID, guestID: string ) => ErrorType;
	leaveLobby: ( lobbyID: lobbyID ) => void;
	getChatHistory: ( lobbyID: lobbyID ) => IChatMsg[] | undefined;
	addChatHistory: ( lobbyID: lobbyID, username: string, message: string ) => void;
}

const LobbiesContext = createContext<ILobbiesContext | null>(null);

export default function LobbiesProvider( { children } : {children: ReactNode} )
{
	const [lobbies, setLobbies] = useState<Lobbies>(defaultLobbies);

	function resetLobbies()
	{
		setLobbies(defaultLobbies);
	}

	function refreshLobbies()
	{
		// TODO: implement later (needs backend)
	}

	function createLobby( lobbyID: lobbyID, hostID: string, lobbyName: string )
	{
		setLobbies(prev => ({
			...prev,
			[lobbyID]: { lobbyName: lobbyName, hostID: hostID, guestID: null, chatHistory: [] },
		}));
	}

	function joinLobby( lobbyID: lobbyID, guestID: string ) : ErrorType
	{
		// TODO: will need to (re)fetch lobbies or just this lobby from backend so early return checks are accurate.

		if ( lobbies[lobbyID] === undefined )
			return ErrorType.lobbyDoesNotExist;
		if ( lobbies[lobbyID].guestID === guestID )
			return ErrorType.none;
		if ( lobbies[lobbyID].guestID !== null )
			return ErrorType.lobbyFull;

		setLobbies(prev => ({
			...prev,
			[lobbyID]: { ...prev[lobbyID], guestID: guestID }
		}));

		return ErrorType.none;
	}

	function leaveLobby( lobbyID: lobbyID )
	{
		setLobbies(prev => {
			if ( prev[lobbyID] === undefined )
				return prev;

			return {
				...prev,
				[lobbyID]: { ...prev[lobbyID], guestID: null }
			};
		});
	}

	function closeLobby( lobbyID: lobbyID )
	{
		setLobbies(prev => {
			if ( prev[lobbyID] === undefined )
				return prev;

			const newLobbies = { ...prev };
			delete newLobbies[lobbyID];
			return newLobbies;
		});
	}

	function getChatHistory( lobbyID: lobbyID ) : IChatMsg[] | undefined
	{
		return lobbies[lobbyID]?.chatHistory;
	}

	function addChatHistory( lobbyID: lobbyID, username: string, message: string )
	{
		const newMsg: IChatMsg = { username: username, message: message, read: true };

		setLobbies(prev => {
			if ( prev[lobbyID] === undefined )
				return prev;

			return {
				...prev,
				[lobbyID]: {
					...prev[lobbyID],
					chatHistory: [ ...(prev[lobbyID].chatHistory ?? []), newMsg ]
				}
			};
		});
	}

	// mock template for later when loading info from database (e.g. when user hits F5 to reload page)
	// at the moment when you hit F5 everything is rerendered and Lobbies info will be set to default again.
	// turn it into a custom hook because it also needs to be called in the login / signup button handler after a succesful login/sign-up

	// useEffect(() =>
	// {
	// 	async function loadLobbies()
	// 	{
	// 		const sessionToken = localStorage.getItem("sessionToken");
	// 		if (await isValidToken(sessionToken))
	// 			setLobbies(await fetchDbUser(sessionToken));
	// 	}
	// 	loadLobbies();
	// }, []);

	return (
		<LobbiesContext.Provider
			value=
			{{
				lobbies,
				resetLobbies,
				refreshLobbies,
				createLobby,
				closeLobby,
				joinLobby,
				leaveLobby,
				getChatHistory,
				addChatHistory,
			}}>
			{children}
		</LobbiesContext.Provider>
	);
}

// import and use useLobbies() anywhere you want to reference or change Lobbies values.
export function useLobbies()
{
	const context = useContext(LobbiesContext);
	if ( !context )
		throw new Error("useLobbies() must be used within a LobbiesProvider");
	return context;
}
