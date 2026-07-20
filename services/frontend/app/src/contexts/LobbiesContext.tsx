import { createContext, useContext, /* useEffect, */ useState } from "react";
import type { ReactNode } from "react";
import type { IChatMsg } from "./ChatHistoryContext";

interface LobbieData
{
	guestID: guestID;
	chatHistory: IChatMsg[];
}

type hostID = string;
type guestID = string | undefined;
type Lobbies = Record<hostID, LobbieData>;

const defaultLobbies: Lobbies =
{
	"hostID_1": { guestID: "guestID_1", chatHistory: [] },
	"hostID_2": { guestID: undefined, chatHistory: [] },
	"hostID_3": { guestID: undefined, chatHistory: [] },
}

interface ILobbiesContext
{
	lobbies: Lobbies;
	createLobby: ( hostID: hostID ) => void;
	getGuestID: ( hostID: hostID ) => string | undefined;
	getChatHistory: ( hostID: hostID ) => IChatMsg[] | undefined;
	addChatHistory: ( hostID: hostID, username: string, message: string ) => void;
}

const LobbiesContext = createContext<ILobbiesContext | null>(null);

export default function LobbiesProvider( { children } : {children: ReactNode} )
{
	const [lobbies, setLobbies] = useState<Lobbies>(defaultLobbies);

	function createLobby( hostID: hostID )
	{
		setLobbies(prev => ({
			...prev,
			[hostID]: { guestID: undefined, chatHistory: [] },
		}));
	}

	function getGuestID( hostID: hostID ) : guestID
	{
		return lobbies[hostID]?.guestID;
	}

	function getChatHistory( hostID: hostID ) : IChatMsg[] | undefined
	{
		return lobbies[hostID]?.chatHistory;
	}

	function addChatHistory( hostID: hostID, username: string, message: string )
	{
		const newMsg: IChatMsg = { username: username, message: message, read: true };

		setLobbies(prev => {
			if ( prev[hostID] === undefined )
				return prev;

			return {
				...prev,
				[hostID]: {
					...prev[hostID],
					chatHistory: [ ...(prev[hostID].chatHistory ?? []), newMsg ]
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
