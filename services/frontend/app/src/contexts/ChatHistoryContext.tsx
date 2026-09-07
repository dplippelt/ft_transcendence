import { createContext, useContext, useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { useAuth } from "./AuthContext";
import { getConversation, markConversationAsRead, sendChatMessage } from "../api/chatApi";
import type { ChatMessageResponse } from "../api/chatApi";
import { getWsUrl } from "../api/http";

export interface IChatMsg
{
	id: number;
	senderId: number;
	content: string;
	createdAt: string;
	read: boolean;
}

type userID = string;
type ChatHistory = Record<userID, IChatMsg[]>;

function toChatMsg( message: ChatMessageResponse, currentUserId: number ): IChatMsg
{
	return {
		id: message.id,
		senderId: message.sender_id,
		content: message.content,
		createdAt: message.created_at,
		// A message the current user sent is never "unread" for them; one
		// the backend already has a read_at for was read on another device.
		read: message.sender_id === currentUserId || message.read_at !== null,
	};
}

interface IChatHistoryContext
{
	chatHistory: ChatHistory;
	resetChatHistory: () => void;
	addChatHistory: ( friendID: string, content: string ) => Promise<void>;
	setChatToRead: ( friendID: string ) => void;
	hasNewMsg: () => boolean;
	countUnreadMsg: ( friendID: string ) => number;
	addChatHistoryEntry: ( friendID: string ) => void;
	removeChatHistoryEntry: ( friendID: string ) => void;
}

const ChatHistoryContext = createContext<IChatHistoryContext | null>(null);

export default function ChatHistoryProvider( { children } : {children: ReactNode} )
{
	const { auth } = useAuth();
	const [chatHistory, setChatHistory] = useState<ChatHistory>({});

	function resetChatHistory()
	{
		setChatHistory({});
	}

	// Reserves the entry immediately (so the UI has something to render
	// right away) then backfills it from the real conversation history, so
	// a friend's chat survives a refresh instead of starting empty every
	// time. No-ops if this friend is already tracked.
	const addChatHistoryEntry = useCallback(( friendID: string ) =>
	{
		const accessToken = auth.accessToken;
		const currentUserId = auth.user?.id;

		if ( !accessToken || currentUserId === undefined )
			return;

		setChatHistory(prev =>
		{
			if ( prev[friendID] !== undefined )
				return prev;

			return { ...prev, [friendID]: [] };
		});

		getConversation(Number(friendID), accessToken)
			.then(messages =>
			{
				setChatHistory(prev => ({
					...prev,
					[friendID]: messages.map(message => toChatMsg(message, currentUserId)),
				}));
			})
			.catch(() => {}); // best-effort: chat stays empty until the next successful load
	}, [auth.accessToken, auth.user?.id]);

	function removeChatHistoryEntry( friendID: string )
	{
		setChatHistory(prev =>
		{
			if ( prev[friendID] === undefined )
				return prev;

			const chatHistory = { ...prev };
			delete chatHistory[friendID];
			return chatHistory;
		});
	}

	async function addChatHistory( friendID: string, content: string )
	{
		if ( !auth.accessToken || auth.user === null )
			throw new Error("No authenticated session");

		const message = await sendChatMessage(Number(friendID), content, auth.accessToken);
		const currentUserId = auth.user.id;

		setChatHistory(prev => ({
			...prev,
			[friendID]: [ ...(prev[friendID] ?? []), toChatMsg(message, currentUserId) ],
		}));
	}

	function setChatToRead( friendID: string )
	{
		setChatHistory(prev =>
		{
			const friendChatHistory = prev[friendID];
			if ( !friendChatHistory )
				return prev;

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

		// Best-effort, same reasoning as everywhere else this pattern shows
		// up: the local read-state already updated, so a failed/late request
		// here shouldn't block or roll back the UI.
		if ( auth.accessToken )
			markConversationAsRead(Number(friendID), auth.accessToken).catch(() => {});
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

	// Live delivery for messages other people send us. Only updates a
	// friend we're already tracking (i.e. addChatHistoryEntry has loaded
	// them) -- a message from someone not yet tracked is picked up the
	// next time their entry loads instead. Reconnects on drop since a
	// closed socket would otherwise silently stop live updates for the
	// rest of the session.
	useEffect(() =>
	{
		const accessToken = auth.accessToken;

		if ( !accessToken )
			return;

		let socket: WebSocket | null = null;
		let reconnectTimeoutID: number | undefined;
		let isCurrent = true;

		function connect()
		{
			if ( !isCurrent )
				return;

			socket = new WebSocket(getWsUrl(`/chat/ws?token=${encodeURIComponent(accessToken!)}`));

			socket.addEventListener("message", (event) =>
			{
				let payload: Partial<ChatMessageResponse> & { type?: string };

				try
				{
					payload = JSON.parse(event.data);
				}
				catch
				{
					return;
				}

				if (
					payload.type !== "chat_message" ||
					payload.sender_id === undefined ||
					payload.id === undefined ||
					payload.content === undefined ||
					payload.created_at === undefined
				)
					return;

				const senderID = String(payload.sender_id);
				const incoming: IChatMsg = {
					id: payload.id,
					senderId: payload.sender_id,
					content: payload.content,
					createdAt: payload.created_at,
					read: false,
				};

				setChatHistory(prev =>
				{
					if ( prev[senderID] === undefined )
						return prev;

					return {
						...prev,
						[senderID]: [ ...prev[senderID], incoming ],
					};
				});
			});

			socket.addEventListener("close", () =>
			{
				if ( isCurrent )
					reconnectTimeoutID = window.setTimeout(connect, 3000);
			});
		}

		connect();

		return () =>
		{
			isCurrent = false;
			clearTimeout(reconnectTimeoutID);
			socket?.close();
		};
	}, [auth.accessToken]);

	return (
		<ChatHistoryContext.Provider
			value=
			{{
				chatHistory,
				resetChatHistory,
				addChatHistory,
				setChatToRead,
				hasNewMsg,
				countUnreadMsg,
				addChatHistoryEntry,
				removeChatHistoryEntry,
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
