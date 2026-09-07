import { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
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

// Combines a friend's existing message list with a newly-fetched/received
// batch, keyed by id so the same message from two sources (e.g. the REST
// backfill and a live WebSocket push racing each other) collapses into one
// entry instead of the later source silently discarding the other, and
// sorted by id (== send order, ids are assigned sequentially by the
// backend) so messages display in the order they were actually sent
// regardless of which network response happens to resolve first.
function mergeMessages( existing: IChatMsg[], incoming: IChatMsg[] ): IChatMsg[]
{
	const byId = new Map<number, IChatMsg>();

	for ( const msg of existing )
		byId.set(msg.id, msg);

	for ( const msg of incoming )
		byId.set(msg.id, msg);

	return Array.from(byId.values()).sort((a, b) => a.id - b.id);
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

	// Which friends' history has already been fetched at least once, so a
	// repeat addChatHistoryEntry call (e.g. every friends-list refresh
	// after any friend-request action) can skip the network round-trip
	// entirely instead of just no-op'ing the local state write.
	const fetchedFriendIDsRef = useRef<Set<string>>(new Set());

	// Mirrors auth.accessToken so an in-flight request's .then() can tell
	// whether the session that issued it is still the current one -- see
	// addChatHistoryEntry below.
	const accessTokenRef = useRef(auth.accessToken);

	useEffect(() =>
	{
		accessTokenRef.current = auth.accessToken;
	}, [auth.accessToken]);

	function resetChatHistory()
	{
		fetchedFriendIDsRef.current.clear();
		setChatHistory({});
	}

	// Reserves the entry immediately (so the UI has something to render
	// right away) then backfills it from the real conversation history, so
	// a friend's chat survives a refresh instead of starting empty every
	// time. No-ops if this friend is already tracked or already fetched.
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

		if ( fetchedFriendIDsRef.current.has(friendID) )
			return;

		fetchedFriendIDsRef.current.add(friendID);

		getConversation(Number(friendID), accessToken)
			.then(messages =>
			{
				// The session may have changed (logout, then a different
				// user logging in on the same tab) while this request was
				// in flight -- applying it now would leak the previous
				// user's messages into the new session's state, so discard
				// it if the token that issued this request is no longer
				// the current one.
				if ( accessTokenRef.current !== accessToken )
					return;

				setChatHistory(prev => ({
					...prev,
					[friendID]: mergeMessages(
						prev[friendID] ?? [],
						messages.map(message => toChatMsg(message, currentUserId)),
					),
				}));
			})
			.catch(() =>
			{
				// Let a later call retry instead of leaving this friend's
				// history permanently stuck empty because of one failure.
				fetchedFriendIDsRef.current.delete(friendID);
			});
	}, [auth.accessToken, auth.user?.id]);

	function removeChatHistoryEntry( friendID: string )
	{
		fetchedFriendIDsRef.current.delete(friendID);

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

		// Merge (keyed + sorted by id) rather than blind-append: two sends
		// fired in quick succession resolve in whatever order the network
		// happens to return them, not necessarily the order they were sent
		// in, so appending naively can display them reversed.
		setChatHistory(prev => ({
			...prev,
			[friendID]: mergeMessages(prev[friendID] ?? [], [toChatMsg(message, currentUserId)]),
		}));
	}

	function setChatToRead( friendID: string )
	{
		const hasUnread = chatHistory[friendID]?.some(msg => !msg.read) ?? false;

		// Bail out (including on the backend call below) when there's
		// nothing locally unread to mark -- most importantly, right after
		// opening a friend's chat for the first time, before their history
		// has finished loading: without this, the backend call would still
		// fire and mark that friend's real messages read before the user
		// had actually seen them, so the unread badge would never show
		// them as unread once they do load.
		if ( !hasUnread )
			return;

		setChatHistory(prev =>
		{
			const friendChatHistory = prev[friendID];
			if ( !friendChatHistory )
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
		const currentUserId = auth.user?.id;

		if ( !accessToken || currentUserId === undefined )
			return;

		let socket: WebSocket | null = null;
		let reconnectTimeoutID: number | undefined;
		let isCurrent = true;

		function connect()
		{
			// Token in the URL query string rather than an Authorization
			// header, since browsers can't set custom headers on a
			// WebSocket handshake -- same tradeoff app/api/dependencies.py's
			// get_current_user_id_ws already documents server-side: this
			// risks exposure via reverse-proxy/access logs, so the
			// deployment needs to stay on WSS and avoid logging query
			// strings for this path.
			// Non-null assertions below: already checked above, but TS
			// can't carry that narrowing into this nested closure since it
			// could (in principle) run later, via the setTimeout in the
			// close listener further down -- these consts are never
			// reassigned, so it still holds whenever this actually runs.
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
					payload.id === undefined ||
					payload.sender_id === undefined ||
					payload.content === undefined ||
					payload.created_at === undefined
				)
					return;

				const senderID = String(payload.sender_id);

				// Route through the same mapping toChatMsg uses for
				// REST-loaded messages instead of a second hand-built
				// IChatMsg, so the two paths can't silently drift apart.
				const incoming = toChatMsg(
					{
						id: payload.id,
						sender_id: payload.sender_id,
						receiver_id: currentUserId!,
						content: payload.content,
						created_at: payload.created_at,
						read_at: payload.read_at ?? null,
					},
					currentUserId!,
				);

				setChatHistory(prev =>
				{
					if ( prev[senderID] === undefined )
						return prev;

					return {
						...prev,
						[senderID]: mergeMessages(prev[senderID], [incoming]),
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
	}, [auth.accessToken, auth.user?.id]);

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
