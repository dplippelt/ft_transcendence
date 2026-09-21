import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

import type { ReactNode } from "react";

import {
	getLobbies,
	getLobby as getLobbyRequest,
	createLobby as createLobbyRequest,
	joinLobby as joinLobbyRequest,
	leaveLobby as leaveLobbyRequest,
	closeLobby as closeLobbyRequest,
	inviteToLobby as inviteToLobbyRequest,
} from "../api/lobbyApi";

import type { ILobbyResponse } from "../api/lobbyApi";
import { useAuth } from "./AuthContext";
import { getWsUrl } from "../api/http"

interface ILobbyChatMsg
{
	username: string;
	message: string;
}

export interface LobbyData extends ILobbyResponse
{
	chatHistory: ILobbyChatMsg[];
}

type LobbyID = string;
type Lobbies = Record<LobbyID, LobbyData>;

interface ILobbiesContext
{
	lobbies: Lobbies;
	resetLobbies: () => void;
	refreshLobbies: () => Promise<void>;
	loadLobby: (lobbyID: LobbyID,) => Promise<LobbyData>;
	createLobby: (lobbyName: string,) => Promise<LobbyData>;
    inviteFriend: (lobbyID: LobbyID, friendID: number,) => Promise<boolean>;
	joinLobby: (lobbyID: LobbyID,) => Promise<LobbyData>;
	leaveLobby: (lobbyID: LobbyID,) => Promise<void>;
	closeLobby: (lobbyID: LobbyID,) => Promise<void>;
	getChatHistory: (lobbyID: LobbyID,) => ILobbyChatMsg[] | undefined;
	addChatHistory: (
		lobbyID: LobbyID,
		username: string,
		message: string,
    ) => void;
}

const LobbiesContext = createContext<ILobbiesContext | null>(null);

function toLobbyData(lobby: ILobbyResponse, existing?: LobbyData): LobbyData
{
    return { ...lobby, chatHistory: existing?.chatHistory ?? [] };
}

function isLobbyResponse(value: unknown,): value is ILobbyResponse
{
    if (typeof value !== "object" || value === null)
        return false;

    const lobby = value as Partial<ILobbyResponse>;

    return (
        typeof lobby.id === "number" &&
        typeof lobby.name === "string" &&
        typeof lobby.created_at === "string" &&
        Array.isArray(lobby.members)
    );
}

export default function LobbiesProvider( { children } : {children: ReactNode} )
{
    const [lobbies, setLobbies] = useState<Lobbies>({});
    const { auth } = useAuth();

    const resetLobbies = useCallback(() => {setLobbies({});}, []);

    const refreshLobbies = useCallback(async () =>
    {
        const accessToken = auth.accessToken;

        if (!accessToken)
            return;

        const lobbyList = await getLobbies(accessToken);

        setLobbies(prev =>
            Object.fromEntries(
                lobbyList.map(lobby =>
                [
                    String(lobby.id),
                    toLobbyData(
                        lobby,
                        prev[String(lobby.id)],
                    ),
                ]
            )
        ));
    },[auth.accessToken]);

    const loadLobby = useCallback(async (lobbyID: string): Promise<LobbyData> =>
    {
        const accessToken = auth.accessToken;

        if (!accessToken)
            throw new Error("No authenticated session");

        const lobby = await getLobbyRequest(Number(lobbyID), accessToken,);

        const lobbyData = toLobbyData(lobby);

        setLobbies(prev => ({
            ...prev,

            [lobbyID]:
                toLobbyData(
                    lobby,
                    prev[lobbyID],
                ),
        }));

        return lobbyData;
    }, [auth.accessToken]);

	const createLobby = useCallback(async (lobbyName: string,): Promise<LobbyData> =>
	{
		const accessToken = auth.accessToken;

		if (!accessToken)
			throw new Error("No authenticated session",);

		const lobby = await createLobbyRequest(lobbyName, accessToken,);

		const lobbyData = toLobbyData(lobby);

		setLobbies(prev => ({
			...prev,
			[String(lobby.id)]: lobbyData,
		}));

		return lobbyData;
    }, [auth.accessToken]);

    const inviteFriend = useCallback(async (lobbyID: string, friendID: number,): Promise<boolean> =>
    {
        const accessToken = auth.accessToken;

        if (!accessToken)
            throw new Error("No authenticated session");

        const result = await inviteToLobbyRequest(
                Number(lobbyID),
                friendID,
                accessToken,
            );
        return result.delivered;
    }, [auth.accessToken]);

	const joinLobby = useCallback(async (lobbyID: string,): Promise<LobbyData> =>
    {
        const accessToken = auth.accessToken;

        if (!accessToken)
            throw new Error("No authenticated session",);

        const lobby = await joinLobbyRequest(Number(lobbyID),accessToken,);

        const lobbyData = toLobbyData(lobby);

        setLobbies(prev => ({
            ...prev,

            [lobbyID]:
                toLobbyData(
                    lobby,
                    prev[lobbyID],
                ),
        }));

        return lobbyData;
    }, [auth.accessToken]);

	const leaveLobby = useCallback(async (lobbyID: string,): Promise<void> =>
	{
		const accessToken = auth.accessToken;

		if (!accessToken)
			throw new Error("No authenticated session",);

		await leaveLobbyRequest(Number(lobbyID), accessToken,);

		await refreshLobbies();
	}, [auth.accessToken, refreshLobbies,]);


	const closeLobby = useCallback(async (lobbyID: string,): Promise<void> =>
	{
		const accessToken = auth.accessToken;

		if (!accessToken)
			throw new Error("No authenticated session",);

		await closeLobbyRequest(Number(lobbyID), accessToken,);

		setLobbies(prev =>
		{
			if (!prev[lobbyID])
				return prev;
			const next = { ...prev };
			delete next[lobbyID];
			return next;
		});
    }, [auth.accessToken]);

	function getChatHistory( lobbyID: string ) : ILobbyChatMsg[] | undefined
	{
		return lobbies[lobbyID]?.chatHistory;
	}

	function addChatHistory( lobbyID: LobbyID, username: string, message: string )
	{
		const newMsg: ILobbyChatMsg = { username, message, };

		setLobbies(prev =>
        {
            if (!prev[lobbyID])
                return prev;

            return {
                ...prev,

                [lobbyID]:
                {
                    ...prev[lobbyID],

                    chatHistory:
                    [
                        ...prev[lobbyID].chatHistory,
                        newMsg,
                    ],
                },
            };
        });
    }

	useEffect(() =>
    {
        if (auth.status === "authenticated")
        {
            void refreshLobbies().catch(() => {});
        }

        if (auth.status === "unauthenticated")
        {
            resetLobbies();
        }
    }, [auth.status, refreshLobbies, resetLobbies,]);

    useEffect(() =>
    {
        const accessToken = auth.accessToken;

        if (auth.status !== "authenticated" || !accessToken)
            return;

        let socket: WebSocket | null = null;
        let reconnectTimeoutID: number | undefined;
        let isCurrent = true;

        function connect()
        {
            socket = new WebSocket(getWsUrl(`/chat/ws?token=${encodeURIComponent(accessToken!)}`),);
            socket.addEventListener("open", () =>
                {
                    if (!isCurrent)
                        return;
                    // recover anything we may have missed while the socket was disconnected
                    void refreshLobbies().catch(() => { });
                },
            );

            socket.addEventListener("message", event =>
                {
                    if (!isCurrent)
                        return;

                    let payload: unknown;
                    try
                    {
                        payload = JSON.parse(event.data);
                    }
                    catch
                    {
                        return;
                    }

                    if (typeof payload !== "object" || payload === null)
                        return;

                    const message = payload as {
                        type?: unknown;
                        lobby?: unknown;
                        lobby_id?: unknown;
                    };

                    if (message.type === "lobby_updated")
                    {
                        if (!isLobbyResponse(message.lobby,))
                            return;

                        const lobby = message.lobby;
                        const lobbyID = String(lobby.id);
                        setLobbies(prev => ({
                            ...prev,
                            [lobbyID]: toLobbyData(lobby, prev[lobbyID],),
                        }));
                        return;
                    }

                    if (message.type === "lobby_closed")
                    {
                        if (typeof message.lobby_id !== "number")
                            return;

                        const lobbyID = String(message.lobby_id);
                        setLobbies(prev => {
                            if (!prev[lobbyID])
                                return prev;
                            const next = { ...prev };
                            delete next[lobbyID];
                            return next;
                        });
                    }
                    // chat_messgae,
                    // conversation_read,
                    // lobby_invite,
                    // are intentionally ignored here
                },
            );

            socket.addEventListener("close", event =>
                {
                    if (isCurrent && event.code !== 1008)
                    {
                        reconnectTimeoutID = window.setTimeout(connect, 3000,);
                    }
                },
            );
        }

        connect();

        return () => {
            isCurrent = false;
            clearTimeout(reconnectTimeoutID);
            socket?.close();
        };
    },[auth.status, auth.accessToken, refreshLobbies,]);

    return (
        <LobbiesContext.Provider
            value=
            {{
                lobbies,
                resetLobbies,
                refreshLobbies,
                loadLobby,
                createLobby,
                closeLobby,
                joinLobby,
                leaveLobby,
                inviteFriend,
                getChatHistory,
                addChatHistory,
            }}
        >
            {children}
        </LobbiesContext.Provider>
    );
}

export function useLobbies()
{
    const context = useContext(LobbiesContext);

    if (!context)
        throw new Error("useLobbies() must be used within a LobbiesProvider",);

    return context;
}
