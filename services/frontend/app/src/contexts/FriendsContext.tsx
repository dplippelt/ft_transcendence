import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import guestAvatar from "../assets/guest_avatar_test.jpg";
import { useAuth } from "./AuthContext";
import { useChatHistory } from "./ChatHistoryContext";
import { useWebSocket } from "./WebSocketContext";
import useLatestRef from "../hooks/useLatestRef";
import { getDisplayName } from "../utils/utils";
import
{
	getFriends,
	getIncomingFriendRequests,
	getOutgoingFriendRequests,
	sendFriendRequest,
	acceptFriendRequest,
	rejectFriendRequest,
	cancelFriendRequest,
	removeFriend as removeFriendRequest,
} from "../api/friendsApi";
import type { PublicUser } from "../api/friendsApi";

export interface IFriendData
{
	username: string;
	avatar: string;
	isOnline: boolean;
}

export interface IFriendRequestData
{
	requestId: number;
	userID: string;
	username: string;
	avatar: string;
}

type userID = string;
type Friends = Record<userID, IFriendData>;

function toFriendData( user: PublicUser, isOnline = false ): IFriendData
{
	return {
		username: getDisplayName(user),
		avatar: user.avatar_url ?? guestAvatar,
		isOnline,
	};
}

function toFriendRequestData( requestId: number, user: PublicUser ): IFriendRequestData
{
	return {
		requestId,
		userID: String(user.id),
		username: getDisplayName(user),
		avatar: user.avatar_url ?? guestAvatar,
	};
}

interface IFriendsContext
{
	friends: Friends;
	incomingRequests: IFriendRequestData[];
	outgoingRequests: IFriendRequestData[];
	selectedFriendID: string | undefined;
	activeFriendID: string | undefined;
	setSelectedFriendID: React.Dispatch<React.SetStateAction<string | undefined>>;
	setActiveFriendID: React.Dispatch<React.SetStateAction<string | undefined>>;
	resetFriends: () => void;
	refreshFriends: () => Promise<void>;
	addFriend: ( username: string ) => Promise<void>;
	removeFriend: ( friendID: string ) => Promise<void>;
	acceptRequest: ( requestId: number ) => Promise<void>;
	rejectRequest: ( requestId: number ) => Promise<void>;
	cancelRequest: ( requestId: number ) => Promise<void>;
}

const FriendsContext = createContext<IFriendsContext | null>(null);

const PRESENCE_RETRY_DELAY_MS = 3000;
const PRESENCE_MAX_RETRIES = 2;

export default function FriendsProvider( { children } : {children: ReactNode} )
{
	const { auth } = useAuth();
	const canUseFriends = auth.status === "authenticated" && !!auth.accessToken && !!auth.user?.username;
	const { subscribe, subscribeOpen } = useWebSocket();
	const { addChatHistoryEntry, removeChatHistoryEntry } = useChatHistory();
	const [friends, setFriends] = useState<Friends>({});
	const [incomingRequests, setIncomingRequests] = useState<IFriendRequestData[]>([]);
	const [outgoingRequests, setOutgoingRequests] = useState<IFriendRequestData[]>([]);
	const [selectedFriendID, setSelectedFriendID] = useState<string | undefined>(undefined);
	const [activeFriendID, setActiveFriendID] = useState<string | undefined>(undefined);

	// Tracks the access token each refresh was made under, so a
	// response that resolves after logout/relogin (a different or null
	// token by then) can be discarded instead of overwriting the new
	// session's state with stale data.
	const accessTokenRef = useLatestRef(auth.accessToken);

	// Each snapshot has its own revision so a presence event cannot
	// invalidate a pending-request fetch.
	const friendListRevisionRef = useRef(0);
	const friendRequestsRevisionRef = useRef(0);

	// Track the last applied list outside React's state updaters so even
	// overlapping refreshes can reconcile removed friends and chat entries.
	const knownFriendIDsRef = useRef<Set<string>>(new Set());

	const resetFriends = useCallback(() =>
	{
		friendListRevisionRef.current += 1;
		friendRequestsRevisionRef.current += 1;
		knownFriendIDsRef.current.clear();
		setSelectedFriendID(undefined);
		setActiveFriendID(undefined);
		setFriends({});
		setIncomingRequests([]);
		setOutgoingRequests([]);
	}, []);

	// Fetch the authoritative friends list, including current presence.
	// Both presence events and full refreshes use this same revision guard.
	const refreshFriendList = useCallback(async () =>
	{
		const requestToken = auth.accessToken;

		if ( !canUseFriends || !requestToken || accessTokenRef.current !== requestToken )
			return;

		const revision = ++friendListRevisionRef.current;
		const friendList = await getFriends(requestToken);

		// Ignore stale responses and responses from previous login sessions.
		if ( accessTokenRef.current !== requestToken || friendListRevisionRef.current !== revision )
			return;

		const newFriends: Friends = Object.fromEntries(
			friendList.friends.map(entry => [String(entry.friend.id), toFriendData(entry.friend, entry.is_online)])
		);

		const newFriendIDs = new Set(Object.keys(newFriends));

		// Passive refreshes can discover that the other user removed a
		// friendship. Clear its local chat and selection state as well.
		for ( const friendID of knownFriendIDsRef.current )
		{
			if ( !newFriendIDs.has(friendID) )
				removeChatHistoryEntry(friendID);
		}
		knownFriendIDsRef.current = newFriendIDs;

		setFriends(newFriends);
		setActiveFriendID(prev => prev && newFriends[prev] === undefined ? undefined : prev);
		setSelectedFriendID(prev => prev && newFriends[prev] === undefined ? undefined : prev);

		// addChatHistoryEntry no-ops if an entry already exists, so this is
		// safe to call on every refresh regardless of who accepted the request.
		for ( const friendID of newFriendIDs )
			addChatHistoryEntry(friendID);
	}, [canUseFriends, auth.accessToken, accessTokenRef, addChatHistoryEntry, removeChatHistoryEntry]);

	const refreshFriendRequests = useCallback(async () =>
	{
		const requestToken = auth.accessToken;

		if ( !canUseFriends || !requestToken || accessTokenRef.current !== requestToken )
			return;

		const revision = ++friendRequestsRevisionRef.current;
		const [incoming, outgoing] = await Promise.all(
		[
			getIncomingFriendRequests(requestToken),
			getOutgoingFriendRequests(requestToken),
		]);

		if ( accessTokenRef.current !== requestToken || friendRequestsRevisionRef.current !== revision )
			return;

		setIncomingRequests(incoming.map(request => toFriendRequestData(request.id, request.requester)));
		setOutgoingRequests(outgoing.map(request => toFriendRequestData(request.id, request.recipient)));
	}, [canUseFriends, auth.accessToken, accessTokenRef]);

	// Full refresh on login, reconnect and after friend mutations.
	const refreshFriends = useCallback(async () =>
	{
		await Promise.all([refreshFriendList(), refreshFriendRequests()]);
	}, [refreshFriendList, refreshFriendRequests]);

	useEffect(() =>
	{
		if ( canUseFriends )
		{
			void refreshFriends().catch(() => {
				// A failed snapshot keeps its previous state. Explicit
				// actions (addFriend, etc.) surface errors separately.
			});
		}
		else if ( auth.status === "unauthenticated" )
			resetFriends();
	}, [canUseFriends, auth.status, refreshFriends, resetFriends]);

	// Presence only invalidates the friends list. Retry a failed fetch a
	// bounded number of times without reintroducing periodic polling.
	useEffect(() =>
	{
		const requestToken = auth.accessToken;

		if ( !canUseFriends || !requestToken )
			return;

		let cancelled = false;
		let retryTimeoutID: number | undefined;

		function clearRetry()
		{
			window.clearTimeout(retryTimeoutID);
			retryTimeoutID = undefined;
		}

		function isCurrent(revision: number)
		{
			return !cancelled && accessTokenRef.current === requestToken &&
				friendListRevisionRef.current === revision;
		}

		async function refreshPresence(retriesLeft: number)
		{
			if ( cancelled || accessTokenRef.current !== requestToken )
				return;

			clearRetry();

			// refreshFriendList increments the revision before its first await.
			const request = refreshFriendList();
			const revision = friendListRevisionRef.current;

			try
			{
				await request;
			}
			catch (error)
			{
				if ( !isCurrent(revision) )
					return;

				if ( retriesLeft === 0 )
				{
					// Preserve the last known presence if all attempts fail.
					console.warn("Failed to refresh friend presence", error);
					return;
				}

				retryTimeoutID = window.setTimeout(() =>
				{
					retryTimeoutID = undefined;
					// A newer presence/full refresh supersedes this retry.
					if ( isCurrent(revision) )
						void refreshPresence(retriesLeft - 1);
				}, PRESENCE_RETRY_DELAY_MS);
			}
		}

		const unsubscribePresence = subscribe("friend_presence_changed", () =>
			refreshPresence(PRESENCE_MAX_RETRIES)
		);

		// A reconnect can also have missed friendship/request updates.
		const unsubscribeOpen = subscribeOpen(() =>
		{
			clearRetry();
			return refreshFriends().catch(() => {
				// Keep the last known data if a snapshot cannot be loaded.
			});
		});

		return () =>
		{
			cancelled = true;
			clearRetry();
			unsubscribePresence();
			unsubscribeOpen();
		};
	}, [canUseFriends, auth.accessToken, accessTokenRef, refreshFriendList, refreshFriends, subscribe, subscribeOpen]);

	async function addFriend( username: string )
	{
		if ( !auth.accessToken )
			return;

		await sendFriendRequest(username, auth.accessToken);
		await refreshFriends();
	}

	async function removeFriend( friendID: string )
	{
		const requestToken = auth.accessToken;

		if ( !requestToken )
			return;

		await removeFriendRequest(Number(friendID), requestToken);

		if ( accessTokenRef.current !== requestToken )
			return;

		setFriends(prev => {
			if ( prev[friendID] === undefined )
				return prev;

			const newFriends = { ...prev };
			delete newFriends[friendID];
			return newFriends;
		});

		setActiveFriendID(prev => prev === friendID ? undefined : prev);
		setSelectedFriendID(prev => prev === friendID ? undefined : prev);

		knownFriendIDsRef.current.delete(friendID);
		removeChatHistoryEntry(friendID);

		// The DELETE already succeeded. Invalidate older refreshes, but
		// don't report a successful removal as failed if the refresh fails.
		await refreshFriends().catch(error =>
		{
			console.warn("Failed to refresh friends after removal", error);
		});
	}

	async function acceptRequest( requestId: number )
	{
		if ( !auth.accessToken )
			return;

		await acceptFriendRequest(requestId, auth.accessToken);
		await refreshFriends();
	}

	async function rejectRequest( requestId: number )
	{
		if ( !auth.accessToken )
			return;

		await rejectFriendRequest(requestId, auth.accessToken);
		await refreshFriends();
	}

	async function cancelRequest( requestId: number )
	{
		if ( !auth.accessToken )
			return;

		await cancelFriendRequest(requestId, auth.accessToken);
		await refreshFriends();
	}

	return (
		<FriendsContext.Provider
			value=
			{{
				friends,
				incomingRequests,
				outgoingRequests,
				selectedFriendID,
				activeFriendID,
				setSelectedFriendID,
				setActiveFriendID,
				resetFriends,
				refreshFriends,
				addFriend,
				removeFriend,
				acceptRequest,
				rejectRequest,
				cancelRequest,
			}}>
			{children}
		</FriendsContext.Provider>
	);
}

// import and use useFriends() anywhere you want to reference or change Friends values.
export function useFriends()
{
	const context = useContext(FriendsContext);
	if ( !context )
		throw new Error("useFriends() must be used within a FriendsProvider");
	return context;
}
