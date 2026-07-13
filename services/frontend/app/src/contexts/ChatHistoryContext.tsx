import { createContext, useContext, /* useEffect, */ useState } from "react";
import type { ReactNode } from "react";

export interface IChatMsg
{
	username: string;
	message: string;
	read: boolean;
}

type userID = string;
type ChatHistory = Record<userID, IChatMsg[]>;

// start temporary default chat history for all default friends for testing
export const defaultChatHistory: ChatHistory =
{
	"Mesca_ID": [],
	"Valr_ID": [],
	"Lemon_ID": [],
	"Crawly_ID": [],
	"Takato_ID": [],
	"Seungah_ID": [],
	"Bell_ID": [],
	"José_ID": [],
	"Friend_1_ID": [],
	"Friend_2_ID": [],
	"Friend_3_ID": [],
	"Friend_4_ID": [],
	"Friend_5_ID": [],
	"Friend_6_ID": [],
	"Friend_7_ID": [],
	"Friend_8_ID": [],
	"Friend_9_ID": [],
}
// end temporary default chat history for all default friends for testing

interface IChatHistoryContext
{
	chatHistory: ChatHistory;
	resetChatHistory: () => void;
	updateUsername: ( oldUsername: string, newUsername: string ) => void;
	addChatHistory: ( friendID: string, username: string, message: string ) => void;
	setChatToRead: ( friendID: string ) => void;
	hasNewMsg: () => boolean;
	countUnreadMsg: ( friendID: string ) => number;
}

const ChatHistoryContext = createContext<IChatHistoryContext | null>(null);

export default function ChatHistoryProvider( { children } : {children: ReactNode} )
{
	const [chatHistory, setChatHistory] = useState<ChatHistory>(defaultChatHistory);

	function resetChatHistory()
	{
		setChatHistory(defaultChatHistory);
	}

	function updateUsername( oldUsername: string, newUsername: string )
	{
		setChatHistory(prev =>
		{
			const updatedHistory = Object.entries(prev).map(([friendID, chatHistory]) => [
				friendID,
				chatHistory.map(msg =>
					msg.username === oldUsername
						? { ...msg, username: newUsername }
						: msg
				)
			]);

			return Object.fromEntries(updatedHistory);
		});
	}

	function addChatHistory( friendID: string, username: string, message: string )
	{
		// NOTE: Setting read to false only for demonstration purposes.
		// 		 Should be true eventually as a message written by the user themselves should never be "unread" for them
		//		 For now, writing a new message to a friend will create new "unread" messages which will trigger the "new/unread messages" effect
		//		 To "read" them you will need to (re)open the friend's chat window
		const newMsg: IChatMsg = { username: username, message: message, read: false }; // TODO: set read to true later!!!;

		setChatHistory(prev => ({
			...prev,
			[friendID]: [ ...prev[friendID], newMsg ]
		}));
	}

	function setChatToRead( friendID: string )
	{
		setChatHistory(prev =>
		{
			const friendChatHistory = prev[friendID];
			const hasUnread = friendChatHistory.some(msg => !msg.read);
			if ( !hasUnread )
				return prev;

			return {
				...prev,
				[friendID]: friendChatHistory.map(msg =>
					msg.read
						? msg
						: { ...msg, read: true }
				)
			}
		});
	}

	function hasNewMsg() : boolean
	{
		return Object.values(chatHistory).some(data =>
			data.some(({ read }) => !read)
		);
	}

	function countUnreadMsg( friendID: string ) : number
	{
		const friendChatHistory = chatHistory[friendID];
		if ( !friendChatHistory )
			return 0;

		return friendChatHistory.filter(({ read }) => !read).length;
	}

	// mock template for later when loading accout info from database after login (e.g. when user hits F5 to reload page)
	// at the moment when you hit F5 everything is rerendered and Chat History info will be set to default again.
	// turn it into a custom hook because it also needs to be called in the login / signup button handler after a succesful login/sign-up

	// useEffect(() =>
	// {
	// 	async function loadChatHistory()
	// 	{
	// 		const sessionToken = localStorage.getItem("sessionToken");
	// 		if (await isValidToken(sessionToken))
	// 			setChatHistory(await fetchDbUser(sessionToken));
	// 	}
	// 	loadChatHistory();
	// }, []);

	return (
		<ChatHistoryContext.Provider
			value=
			{{
				chatHistory, resetChatHistory, updateUsername, addChatHistory, setChatToRead, hasNewMsg, countUnreadMsg,
			}}>
			{children}
		</ChatHistoryContext.Provider>
	);
}

// import and use useChatHistory() anywhere you want to reference or change Friends values.
export function useChatHistory()
{
	const context = useContext(ChatHistoryContext);
	if ( !context )
		throw new Error("useChatHistory() must be used within a ChatHistoryProvider");
	return context;
}
