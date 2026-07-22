import { createContext, useContext, /* useEffect, */ useState } from "react";
import type { ReactNode } from "react";
import type { IChatMsg } from "./ChatHistoryContext";

export interface LobbieData
{
	lobbyName: string;
	hostID: string;
	guestID: guestID;
	chatHistory: IChatMsg[];
}

type lobbyID = string;
type guestID = string | undefined;
type Lobbies = Record<lobbyID, LobbieData>;

const defaultLobbies: Lobbies =
{
	"lobbyID_1": { lobbyName: "Lobby 1", hostID: "hostID_1", guestID: "guestID_1", chatHistory: [] },
	"lobbyID_2": { lobbyName: "Lobby 2", hostID: "hostID_2", guestID: undefined, chatHistory: [] },
	"lobbyID_3": { lobbyName: "Lobby 3", hostID: "hostID_3", guestID: undefined, chatHistory: [] },
}

interface ILobbiesContext
{
	lobbies: Lobbies;
	createLobby: ( lobbyID: lobbyID, hostID: string, lobbyName: string ) => void;
	closeLobby: ( lobbyID: lobbyID ) => void;
	getGuestID: ( lobbyID: lobbyID ) => string | undefined;
	getChatHistory: ( lobbyID: lobbyID ) => IChatMsg[] | undefined;
	addChatHistory: ( lobbyID: lobbyID, username: string, message: string ) => void;
}

const LobbiesContext = createContext<ILobbiesContext | null>(null);

export default function LobbiesProvider( { children } : {children: ReactNode} )
{
	const [lobbies, setLobbies] = useState<Lobbies>(defaultLobbies);

	function createLobby( lobbyID: lobbyID, hostID: string, lobbyName: string )
	{
		setLobbies(prev => ({
			...prev,
			[lobbyID]: { lobbyName: lobbyName, hostID: hostID, guestID: undefined, chatHistory: [] },
		}));
	}

	function closeLobby( lobbyID: lobbyID )
	{
		setLobbies(prev => {
			if ( !prev[lobbyID] )
				return prev;

			const newLobbies = { ...prev };
			delete newLobbies[lobbyID];
			return newLobbies;
		});
	}

	function getGuestID( lobbyID: lobbyID ) : guestID
	{
		return lobbies[lobbyID]?.guestID;
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
				createLobby,
				closeLobby,
				getGuestID,
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
