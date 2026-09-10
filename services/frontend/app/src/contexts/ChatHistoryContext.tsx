import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useAuth } from "./AuthContext";
import { getConversation, markConversationAsRead, sendChatMessage } from "../api/chatApi";
import type { ChatMessageResponse } from "../api/chatApi";
import { getWsUrl } from "../api/http";
import useLatestRef from "../hooks/useLatestRef";

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
	{
		const prior = byId.get(msg.id);

		// read only ever moves forward (unread -> read), never back: without
		// this, a REST response that started before a WS-triggered local
		// read mark but resolves after it (its own read_at may still be
		// null server-side at that point) would silently regress an
		// already-seen message back to unread.
		byId.set(msg.id, prior?.read ? { ...msg, read: true } : msg);
	}

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

	// Friend ids with a markConversationAsRead request currently in flight,
	// so two setChatToRead calls fired back to back for the same friend
	// (e.g. a live message landing right as the chat opens, or React
	// StrictMode's dev double-invoke) -- both reading the same
	// not-yet-updated chatHistory and both seeing it as unread -- don't
	// both fire the same network call.
	const pendingReadMarksRef = useRef<Set<string>>(new Set());

	// Friend ids that got another setChatToRead call while their
	// markConversationAsRead was still in flight. A new message can arrive
	// (and be marked read locally) in that window, so rather than dropping
	// the second call we run one more pass once the in-flight request
	// settles, to push that newer read state to the backend too.
	const rereadFriendsRef = useRef<Set<string>>(new Set());

	// Points at the latest setChatToRead so the settle handler below can
	// re-run it against current chatHistory, not the stale closure the
	// in-flight request was created in.
	const setChatToReadRef = useRef<( friendID: string ) => void>(() => {});

	// Mirrors auth.accessToken so an in-flight request's .then() can tell
	// whether the session that issued it is still the current one -- see
	// addChatHistoryEntry below.
	const accessTokenRef = useLatestRef(auth.accessToken);

	const resetChatHistory = useCallback(() =>
	{
		fetchedFriendIDsRef.current.clear();
		setChatHistory({});
	}, []);

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

				setChatHistory(prev =>
				{
					// The friend may have been removed (removeChatHistoryEntry)
					// while this request was in flight -- applying it now
					// would resurrect an entry the user explicitly removed.
					if ( prev[friendID] === undefined )
						return prev;

					return {
						...prev,
						[friendID]: mergeMessages(
							prev[friendID],
							messages.map(message => toChatMsg(message, currentUserId)),
						),
					};
				});
			})
			.catch(() =>
			{
				// Let a later call retry instead of leaving this friend's
				// history permanently stuck empty because of one failure.
				fetchedFriendIDsRef.current.delete(friendID);
			});
	}, [auth.accessToken, auth.user?.id, accessTokenRef]);

	const removeChatHistoryEntry = useCallback(( friendID: string ) =>
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
	}, []);

	const addChatHistory = useCallback(async ( friendID: string, content: string ) =>
	{
		if ( !auth.accessToken || auth.user === null )
			throw new Error("No authenticated session");

		const message = await sendChatMessage(Number(friendID), content, auth.accessToken);
		const currentUserId = auth.user.id;

		setChatHistory(prev =>
		{
			// The friend may have been removed (removeChatHistoryEntry)
			// while this send was in flight -- same guard the fetch and
			// reconnect paths use, so a send that resolves late can't
			// resurrect an entry the user explicitly removed.
			if ( prev[friendID] === undefined )
				return prev;

			// Merge (keyed + sorted by id) rather than blind-append: two
			// sends fired in quick succession resolve in whatever order the
			// network happens to return them, not necessarily the order
			// they were sent in, so appending naively can display them
			// reversed.
			return {
				...prev,
				[friendID]: mergeMessages(prev[friendID], [toChatMsg(message, currentUserId)]),
			};
		});
	}, [auth.accessToken, auth.user]);

	const setChatToRead = useCallback(( friendID: string ) =>
	{
		const unreadIds = new Set(
			(chatHistory[friendID] ?? []).filter(msg => !msg.read).map(msg => msg.id)
		);

		// Bail out (including on the backend call below) when there's
		// nothing locally unread to mark -- most importantly, right after
		// opening a friend's chat for the first time, before their history
		// has finished loading: without this, the backend call would still
		// fire and mark that friend's real messages read before the user
		// had actually seen them, so the unread badge would never show
		// them as unread once they do load.
		if ( unreadIds.size === 0 )
			return;

		setChatHistory(prev =>
		{
			const friendChatHistory = prev[friendID];
			if ( !friendChatHistory )
				return prev;

			return {
				...prev,
				[friendID]: friendChatHistory.map(msg =>
					unreadIds.has(msg.id)
						? { ...msg, read: true }
						: msg
				)
			}
		});

		if ( !auth.accessToken )
			return;

		// A request is already in flight for this friend: note that
		// another pass is wanted once it settles (a message may have
		// arrived and been marked read locally in the meantime) rather
		// than dropping this call entirely.
		if ( pendingReadMarksRef.current.has(friendID) )
		{
			rereadFriendsRef.current.add(friendID);
			return;
		}

		pendingReadMarksRef.current.add(friendID);

		markConversationAsRead(Number(friendID), auth.accessToken)
			.catch(() =>
		{
			// Roll back just the messages this call marked read (not the
			// whole friend, in case more arrived and got marked read in
			// the meantime) so a failed request leaves them unread rather
			// than silently drifting from the backend's real state -- the
			// next time this chat is (re)opened or a new message arrives,
			// the effect that calls setChatToRead retries naturally.
			setChatHistory(prev =>
			{
				const friendChatHistory = prev[friendID];
				if ( !friendChatHistory )
					return prev;

				return {
					...prev,
					[friendID]: friendChatHistory.map(msg =>
						unreadIds.has(msg.id)
							? { ...msg, read: false }
							: msg
					)
				};
			});
		})
			.finally(() =>
			{
				pendingReadMarksRef.current.delete(friendID);

				// Something asked to mark this friend read again while the
				// request was in flight -- run one more pass now against
				// current state. setChatToRead no-ops if nothing is left
				// unread, so this can't loop unless messages keep arriving.
				if ( rereadFriendsRef.current.delete(friendID) )
					setChatToReadRef.current(friendID);
			});
	}, [chatHistory, auth.accessToken]);

	useEffect(() => { setChatToReadRef.current = setChatToRead; }, [setChatToRead]);

	const hasNewMsg = useCallback(() : boolean =>
	{
		return Object.values(chatHistory).some(data =>
			data.some(({ read }) => !read)
		);
	}, [chatHistory]);

	const countUnreadMsg = useCallback(( friendID: string ) : number =>
	{
		const friendChatHistory = chatHistory[friendID];
		if ( !friendChatHistory )
			return 0;

		return friendChatHistory.filter(({ read }) => !read).length;
	}, [chatHistory]);

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

		// Re-pulls a friend's full conversation and merges it into local
		// state (mergeMessages dedupes by id, so this is safe to call
		// against an already-populated history). Run from the "open"
		// listener below on every successful connect: a message persisted
		// between this client's last delivery and the socket (re)connecting
		// was never pushed anywhere, and fetchedFriendIDsRef would
		// otherwise stop addChatHistoryEntry from ever fetching it either.
		// accessToken/currentUserId are taken as parameters (rather than
		// read from the outer closure) so they keep their already-narrowed
		// non-nullable types here without needing a non-null assertion.
		function refetchConversation( friendID: string, accessToken: string, currentUserId: number )
		{
			getConversation(Number(friendID), accessToken)
				.then(messages =>
				{
					if ( accessTokenRef.current !== accessToken )
						return;

					setChatHistory(prev =>
					{
						// Friend may have been removed since the reconnect
						// started (removeChatHistoryEntry) -- don't resurrect it.
						if ( prev[friendID] === undefined )
							return prev;

						return {
							...prev,
							[friendID]: mergeMessages(
								prev[friendID],
								messages.map(message => toChatMsg(message, currentUserId)),
							),
						};
					});
				})
				.catch(() => {}); // best-effort; the next reconnect retries this too
		}

		// Same parameter-passing reasoning as refetchConversation above.
		function connect( accessToken: string, currentUserId: number )
		{
			// Token in the URL query string rather than an Authorization
			// header, since browsers can't set custom headers on a
			// WebSocket handshake -- same tradeoff app/api/dependencies.py's
			// get_current_user_id_ws already documents server-side: this
			// risks exposure via reverse-proxy/access logs, so the
			// deployment needs to stay on WSS and avoid logging query
			// strings for this path.
			socket = new WebSocket(getWsUrl(`/chat/ws?token=${encodeURIComponent(accessToken)}`));

			socket.addEventListener("open", () =>
			{
				// Every successful connect, first one included: between the
				// initial REST history resolving and this handshake
				// completing there's a window where a freshly-persisted
				// message is pushed to nobody. The redundant fetch that
				// overlaps addChatHistoryEntry's own initial load on first
				// connect is harmless -- mergeMessages dedupes by id.
				for ( const friendID of fetchedFriendIDsRef.current )
					refetchConversation(friendID, accessToken, currentUserId);
			});

			socket.addEventListener("message", (event) =>
			{
				let payload: Partial<ChatMessageResponse> & { type?: string; friend_id?: number };

				try
				{
					payload = JSON.parse(event.data);
				}
				catch
				{
					return;
				}

				// The user read this conversation on another tab/device --
				// clear our own unread state for it so the badge doesn't
				// stay stuck until the next refetch/reconnect.
				if ( payload.type === "conversation_read" )
				{
					if ( payload.friend_id === undefined )
						return;

					const readFriendID = String(payload.friend_id);

					setChatHistory(prev =>
					{
						const friendChatHistory = prev[readFriendID];
						if ( !friendChatHistory || !friendChatHistory.some(msg => !msg.read) )
							return prev;

						return {
							...prev,
							[readFriendID]: friendChatHistory.map(msg =>
								msg.read ? msg : { ...msg, read: true }
							),
						};
					});

					return;
				}

				if (
					payload.type !== "chat_message" ||
					payload.id === undefined ||
					payload.sender_id === undefined ||
					payload.receiver_id === undefined ||
					payload.content === undefined ||
					payload.created_at === undefined
				)
					return;

				// The backend pushes a sent message back to the sender's
				// own other tabs/devices too, not just the receiver's, so
				// this push can be our own echo. The conversation it
				// belongs to is keyed by whichever side isn't us.
				const isOwnMessage = payload.sender_id === currentUserId;
				const friendID = String(isOwnMessage ? payload.receiver_id : payload.sender_id);

				// Route through the same mapping toChatMsg uses for
				// REST-loaded messages instead of a second hand-built
				// IChatMsg, so the two paths can't silently drift apart.
				const incoming = toChatMsg(
					{
						id: payload.id,
						sender_id: payload.sender_id,
						receiver_id: payload.receiver_id,
						content: payload.content,
						created_at: payload.created_at,
						read_at: payload.read_at ?? null,
					},
					currentUserId,
				);

				setChatHistory(prev =>
				{
					if ( prev[friendID] === undefined )
						return prev;

					return {
						...prev,
						[friendID]: mergeMessages(prev[friendID], [incoming]),
					};
				});
			});

			socket.addEventListener("close", (event) =>
			{
				// 1008 (policy violation) is what get_current_user_id_ws
				// closes with when the token itself is rejected -- retrying
				// with that same token would just fail the same way every
				// 3s forever, so only reconnect on other, recoverable
				// closes (network drop, server restart, etc). The socket
				// picks back up once a valid token flows through (this
				// effect re-runs on auth.accessToken changing).
				if ( isCurrent && event.code !== 1008 )
					reconnectTimeoutID = window.setTimeout(() => connect(accessToken, currentUserId), 3000);
			});
		}

		connect(accessToken, currentUserId);

		return () =>
		{
			isCurrent = false;
			clearTimeout(reconnectTimeoutID);
			socket?.close();
		};
	}, [auth.accessToken, auth.user?.id, accessTokenRef]);

	const value = useMemo(() => (
	{
		chatHistory,
		resetChatHistory,
		addChatHistory,
		setChatToRead,
		hasNewMsg,
		countUnreadMsg,
		addChatHistoryEntry,
		removeChatHistoryEntry,
	}), [
		chatHistory,
		resetChatHistory,
		addChatHistory,
		setChatToRead,
		hasNewMsg,
		countUnreadMsg,
		addChatHistoryEntry,
		removeChatHistoryEntry,
	]);

	return (
		<ChatHistoryContext.Provider value={value}>
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
