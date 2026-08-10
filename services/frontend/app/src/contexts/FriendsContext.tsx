import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import type { ReactNode } from "react";
import guestAvatar from "../assets/guest_avatar_test.jpg";
import { useAuth } from "./AuthContext";
import { useChatHistory } from "./ChatHistoryContext";
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

function toFriendData( user: PublicUser ): IFriendData
{
	return {
		username: user.username ?? user.display_name ?? "Unknown",
		avatar: user.avatar_url ?? guestAvatar,
	};
}

function toFriendRequestData( requestId: number, user: PublicUser ): IFriendRequestData
{
	return {
		requestId,
		userID: String(user.id),
		...toFriendData(user),
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

export default function FriendsProvider( { children } : {children: ReactNode} )
{
	const { auth } = useAuth();
	const { addChatHistoryEntry, removeChatHistoryEntry } = useChatHistory();
	const [friends, setFriends] = useState<Friends>({});
	const [incomingRequests, setIncomingRequests] = useState<IFriendRequestData[]>([]);
	const [outgoingRequests, setOutgoingRequests] = useState<IFriendRequestData[]>([]);
	const [selectedFriendID, setSelectedFriendID] = useState<string | undefined>(undefined);
	const [activeFriendID, setActiveFriendID] = useState<string | undefined>(undefined);

	// Tracks the access token a refreshFriends() call was made under, so a
	// response that resolves after logout/relogin (a different or null
	// token by then) can be discarded instead of overwriting the new
	// session's state with stale data.
	const accessTokenRef = useRef(auth.accessToken);
	accessTokenRef.current = auth.accessToken;

	const resetFriends = useCallback(() =>
	{
		setSelectedFriendID(undefined);
		setActiveFriendID(undefined);
		setFriends({});
		setIncomingRequests([]);
		setOutgoingRequests([]);
	}, []);

	// Fetches friends + pending requests fresh from the backend. Called on
	// login and after every mutation (send/accept/reject/cancel/remove)
	// rather than optimistically patching local state, since a request can
	// be accepted/removed from the other side at any time too.
	const refreshFriends = useCallback(async () =>
	{
		const requestToken = auth.accessToken;

		if ( !requestToken )
			return;

		const [friendList, incoming, outgoing] = await Promise.all(
		[
			getFriends(requestToken),
			getIncomingFriendRequests(requestToken),
			getOutgoingFriendRequests(requestToken),
		]);

		// The session changed while this request was in flight (logout, or
		// a different user logged in) -- this response no longer belongs
		// to the active session, so don't let it clobber current state.
		if ( accessTokenRef.current !== requestToken )
			return;

		const newFriends: Friends = Object.fromEntries(
			friendList.friends.map(entry => [String(entry.friend.id), toFriendData(entry.friend)])
		);

		setFriends(newFriends);
		setIncomingRequests(incoming.map(request => toFriendRequestData(request.id, request.requester)));
		setOutgoingRequests(outgoing.map(request => toFriendRequestData(request.id, request.recipient)));

		// addChatHistoryEntry no-ops if an entry already exists, so this is
		// safe to call on every refresh regardless of who accepted the request.
		for ( const friendID of Object.keys(newFriends) )
			addChatHistoryEntry(friendID);
	}, [auth.accessToken, addChatHistoryEntry]);

	useEffect(() =>
	{
		if ( auth.status === "authenticated" )
		{
			void refreshFriends().catch(() => {
				// A background refresh failure just leaves the previous
				// state in place; explicit actions (addFriend, etc.) surface
				// their own errors to the user separately.
			});
		}
		else if ( auth.status === "unauthenticated" )
			resetFriends();
	}, [auth.status, refreshFriends, resetFriends]);

	async function addFriend( username: string )
	{
		if ( !auth.accessToken )
			return;

		await sendFriendRequest(username, auth.accessToken);
		await refreshFriends();
	}

	async function removeFriend( friendID: string )
	{
		if ( !auth.accessToken )
			return;

		await removeFriendRequest(Number(friendID), auth.accessToken);

		setFriends(prev => {
			if ( prev[friendID] === undefined )
				return prev;

			const newFriends = { ...prev };
			delete newFriends[friendID];
			return newFriends;
		});

		if ( friendID === activeFriendID )
			setActiveFriendID(undefined);
		if ( friendID === selectedFriendID )
			setSelectedFriendID(undefined);

		removeChatHistoryEntry(friendID);
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
