import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
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
    lobbyStartGame as lobbyStartGameRequest,
} from "../api/lobbyApi";

import type { ILobbyGame, ILobbyResponse } from "../api/lobbyApi";
import type { PublicUser } from "../api/friendsApi";
import { useAuth } from "./AuthContext";
import { getWsUrl } from "../api/http";

interface ILobbyChatMsg
{
    username: string;
    message: string;
}

export interface LobbyData extends ILobbyResponse
{
    chatHistory: ILobbyChatMsg[];
}

export interface LobbyInvite
{
    lobby_id: number;
    lobby_name: string;
    inviter: PublicUser;
}

export interface StartedMultiGame
{
    lobbyId: LobbyID;
    gameSessionId: string;
}

// Keep in sync with the backend MAX_MEMBERS for lobby availability.
const MAX_LOBBY_MEMBERS = 2;

type LobbyID = string;
type Lobbies = Record<LobbyID, LobbyData>;

interface ILobbiesContext
{
    lobbies: Lobbies;
    lobbyInvites: LobbyInvite[];
    resetLobbies: () => void;
    refreshLobbies: () => Promise<void>;
    loadLobby: (lobbyID: LobbyID) => Promise<LobbyData>;
    createLobby: (lobbyName: string) => Promise<LobbyData>;
    inviteFriend: (lobbyID: LobbyID, friendID: number) => Promise<boolean>;
    dismissLobbyInvite: (lobbyID: LobbyID | number) => void;
    joinLobby: (lobbyID: LobbyID) => Promise<LobbyData>;
    leaveLobby: (lobbyID: LobbyID) => Promise<void>;
    closeLobby: (lobbyID: LobbyID) => Promise<void>;
    lobbyStartGame: (lobbyID: LobbyID) => Promise<ILobbyGame>;
    getChatHistory: (lobbyID: LobbyID) => ILobbyChatMsg[] | undefined;
    addChatHistory: (
        lobbyID: LobbyID,
        username: string,
        message: string,
    ) => void;
    startedMultiGame: StartedMultiGame | null;
    clearStartedMultiGame: () => void;
}

const LobbiesContext = createContext<ILobbiesContext | null>(null);

function toLobbyData(lobby: ILobbyResponse, existing?: LobbyData): LobbyData
{
    return { ...lobby, chatHistory: existing?.chatHistory ?? [] };
}

function isLobbyResponse(value: unknown): value is ILobbyResponse
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

// Reconcile an API snapshot without discarding lobby changes that arrived
// via WebSocket or successful local actions while the request was in flight.
function mergeLobbySnapshot(
    lobbyList: ILobbyResponse[],
    previous: Lobbies,
    revisions: Record<LobbyID, number>,
    requestStartedAt: number,
): Lobbies
{
    const next: Lobbies = {};

    for (const lobby of lobbyList)
    {
        const lobbyID = String(lobby.id);
        next[lobbyID] = toLobbyData(lobby, previous[lobbyID]);
    }

    for (const [lobbyID, revision] of Object.entries(revisions))
    {
        if (revision <= requestStartedAt)
            continue;

        if (previous[lobbyID])
            next[lobbyID] = previous[lobbyID]; // Updated/created while loading.
        else
            delete next[lobbyID]; // Closed while loading; don't resurrect it.
    }

    return next;
}

export default function LobbiesProvider({ children }: { children: ReactNode })
{
    const { auth } = useAuth();
    const [lobbies, setLobbies] = useState<Lobbies>({});
    const [lobbyInvites, setLobbyInvites] = useState<LobbyInvite[]>([]);
    const [startedMultiGame, setStartedMultiGame] = useState<StartedMultiGame | null>(null);

    const lobbyVersionRef = useRef(0);
    const lobbyRevisionsRef = useRef<Record<LobbyID, number>>({});
    const sessionRef = useRef(0);
    const inviteVersionRef = useRef(0);
    // Last received invite version for each lobby. A fresh invite should not be
    // removed by an older lobby-list snapshot that was already in flight.
    const inviteRevisionsRef = useRef<Record<LobbyID, number>>({});
    const nextRefreshIDRef = useRef(0);
    const lastAppliedRefreshIDRef = useRef(0);

    const markLobbyChanged = useCallback((lobbyID: LobbyID) =>
    {
        lobbyRevisionsRef.current[lobbyID] = ++lobbyVersionRef.current;
    }, []);

    const resetLobbies = useCallback(() =>
    {
        // Invalidate pending API responses from the previous session.
        sessionRef.current += 1;
        lobbyVersionRef.current = 0;
        lobbyRevisionsRef.current = {};
        inviteVersionRef.current = 0;
        inviteRevisionsRef.current = {};
        setLobbies({});
        setLobbyInvites([]);
        setStartedMultiGame(null);
    }, []);

    const refreshLobbies = useCallback(async () =>
    {
        const accessToken = auth.accessToken;
        if (!accessToken)
            return;

        const session = sessionRef.current;
        const startedAt = lobbyVersionRef.current;
        const inviteVersionAtStart = inviteVersionRef.current;
        const refreshID = ++nextRefreshIDRef.current;
        const lobbyList = await getLobbies(accessToken);

        if (session !== sessionRef.current || refreshID < lastAppliedRefreshIDRef.current)
            return;

        lastAppliedRefreshIDRef.current = refreshID;
        // Remove stale invites present when the request started, but preserve
        // invites received or refreshed while the snapshot was in flight.
        const joinableIDs = new Set(
            lobbyList
                .filter(lobby =>
                    lobby.members.length < MAX_LOBBY_MEMBERS &&
                    !lobby.members.some(member => member.user.id === auth.user?.id)
                )
                .map(lobby => lobby.id)
        );
        setLobbyInvites(previous =>
        {
            if (session !== sessionRef.current || refreshID < lastAppliedRefreshIDRef.current)
                return previous;

            return previous.filter(invite =>
                (inviteRevisionsRef.current[String(invite.lobby_id)] ?? 0) > inviteVersionAtStart ||
                joinableIDs.has(invite.lobby_id)
            );
        });
        setLobbies(previous =>
        {
            if (session !== sessionRef.current || refreshID < lastAppliedRefreshIDRef.current)
                return previous;

            return mergeLobbySnapshot(
                lobbyList,
                previous,
                lobbyRevisionsRef.current,
                startedAt,
            );
        });
    }, [auth.accessToken, auth.user?.id]);

    const loadLobby = useCallback(async (lobbyID: LobbyID): Promise<LobbyData> =>
    {
        const accessToken = auth.accessToken;
        if (!accessToken)
            throw new Error("No authenticated session");

        const session = sessionRef.current;
        const startedAt = lobbyVersionRef.current;
        const lobby = await getLobbyRequest(Number(lobbyID), accessToken);
        const lobbyData = toLobbyData(lobby);

        if (session === sessionRef.current &&
            (lobbyRevisionsRef.current[lobbyID] ?? 0) <= startedAt)
        {
            markLobbyChanged(lobbyID);
            setLobbies(previous => ({
                ...previous,
                [lobbyID]: toLobbyData(lobby, previous[lobbyID]),
            }));
        }

        return lobbyData;
    }, [auth.accessToken, markLobbyChanged]);

    const createLobby = useCallback(async (lobbyName: string): Promise<LobbyData> =>
    {
        const accessToken = auth.accessToken;
        if (!accessToken)
            throw new Error("No authenticated session");

        const session = sessionRef.current;
        const lobby = await createLobbyRequest(lobbyName, accessToken);
        const lobbyID = String(lobby.id);
        const lobbyData = toLobbyData(lobby);

        if (session === sessionRef.current)
        {
            markLobbyChanged(lobbyID);
            setLobbies(previous => session === sessionRef.current ? ({
                ...previous,
                [lobbyID]: toLobbyData(lobby, previous[lobbyID]),
            }) : previous);
        }
        return lobbyData;
    }, [auth.accessToken, markLobbyChanged]);

    const inviteFriend = useCallback(async (lobbyID: LobbyID, friendID: number): Promise<boolean> =>
    {
        const accessToken = auth.accessToken;
        if (!accessToken)
            throw new Error("No authenticated session");

        const result = await inviteToLobbyRequest(Number(lobbyID), friendID, accessToken);
        return result.delivered;
    }, [auth.accessToken]);

    const dismissLobbyInvite = useCallback((lobbyID: LobbyID | number) =>
    {
        setLobbyInvites(previous =>
            previous.filter(invite => String(invite.lobby_id) !== String(lobbyID))
        );
    }, []);

    const joinLobby = useCallback(async (lobbyID: LobbyID): Promise<LobbyData> =>
    {
        const accessToken = auth.accessToken;
        if (!accessToken)
            throw new Error("No authenticated session");

        const session = sessionRef.current;
        const lobby = await joinLobbyRequest(Number(lobbyID), accessToken);
        const lobbyData = toLobbyData(lobby);

        if (session === sessionRef.current)
        {
            markLobbyChanged(lobbyID);
            setLobbies(previous => session === sessionRef.current ? ({
                ...previous,
                [lobbyID]: toLobbyData(lobby, previous[lobbyID]),
            }) : previous);
            dismissLobbyInvite(lobbyID);
        }
        return lobbyData;
    }, [auth.accessToken, markLobbyChanged, dismissLobbyInvite]);

    const leaveLobby = useCallback(async (lobbyID: LobbyID): Promise<void> =>
    {
        const accessToken = auth.accessToken;
        if (!accessToken)
            throw new Error("No authenticated session");

        const session = sessionRef.current;
        await leaveLobbyRequest(Number(lobbyID), accessToken);

        if (session !== sessionRef.current)
            return;

        // The mutation succeeded even if the subsequent browser refresh fails.
        const currentUserID = auth.user?.id;
        markLobbyChanged(lobbyID);
        setLobbies(previous =>
        {
            const lobby = previous[lobbyID];
            if (session !== sessionRef.current || !lobby || currentUserID === undefined)
                return previous;

            const leavingMember = lobby.members.find(member => member.user.id === currentUserID);
            if (leavingMember?.role === "host")
            {
                const next = { ...previous };
                delete next[lobbyID];
                return next;
            }

            return {
                ...previous,
                [lobbyID]: {
                    ...lobby,
                    members: lobby.members.filter(member => member.user.id !== currentUserID),
                },
            };
        });
        void refreshLobbies().catch(error => {
            console.warn("Lobby list refresh failed after leaving:", error);
        });
    }, [auth.accessToken, auth.user, refreshLobbies, markLobbyChanged]);

    const closeLobby = useCallback(async (lobbyID: LobbyID): Promise<void> =>
    {
        const accessToken = auth.accessToken;
        if (!accessToken)
            throw new Error("No authenticated session");

        const session = sessionRef.current;
        await closeLobbyRequest(Number(lobbyID), accessToken);
        if (session !== sessionRef.current)
            return;

        markLobbyChanged(lobbyID);
        setLobbies(previous =>
        {
            if (session !== sessionRef.current || !previous[lobbyID])
                return previous;
            const next = { ...previous };
            delete next[lobbyID];
            return next;
        });
        dismissLobbyInvite(lobbyID);
    }, [auth.accessToken, markLobbyChanged, dismissLobbyInvite]);

    const lobbyStartGame = useCallback(async (lobbyId: LobbyID): Promise<ILobbyGame> =>
    {
        const accessToken = auth.accessToken;
        if (!accessToken)
            throw new Error("No authenticated session");

        return await lobbyStartGameRequest(Number(lobbyId), accessToken);

    }, [auth.accessToken]);

    function getChatHistory(lobbyID: LobbyID): ILobbyChatMsg[] | undefined
    {
        return lobbies[lobbyID]?.chatHistory;
    }

    function addChatHistory(lobbyID: LobbyID, username: string, message: string)
    {
        const newMsg: ILobbyChatMsg = { username, message };
        setLobbies(previous =>
        {
            const lobby = previous[lobbyID];
            if (!lobby)
                return previous;

            return {
                ...previous,
                [lobbyID]: {
                    ...lobby,
                    chatHistory: [...lobby.chatHistory, newMsg],
                },
            };
        });
    }

    const clearStartedMultiGame = useCallback(() => setStartedMultiGame(null), []);

    useEffect(() =>
    {
        if (auth.status === "authenticated")
            void refreshLobbies().catch(() => {});

        if (auth.status === "unauthenticated")
            resetLobbies();
    }, [auth.status, refreshLobbies, resetLobbies]);

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
            socket = new WebSocket(
                getWsUrl(`/chat/ws?token=${encodeURIComponent(accessToken!)}`),
            );

            socket.addEventListener("open", () =>
            {
                if (!isCurrent)
                    return;

                // Recover lobby changes missed during a disconnection.
                void refreshLobbies().catch(() => {});
            });

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
                    lobby_name?: unknown;
                    inviter?: unknown;
                    game?: unknown;
                };

                if (message.type === "lobby_updated")
                {
                    if (!isLobbyResponse(message.lobby))
                        return;

                    const lobby = message.lobby;
                    const lobbyID = String(lobby.id);
                    markLobbyChanged(lobbyID);
                    setLobbies(previous => ({
                        ...previous,
                        [lobbyID]: toLobbyData(lobby, previous[lobbyID]),
                    }));

                    // The invite is no longer actionable if the lobby is full
                    // or the current user has already joined (possibly elsewhere).
                    if (
                        lobby.members.length >= MAX_LOBBY_MEMBERS ||
                        lobby.members.some(member => member.user.id === auth.user?.id)
                    )
                        dismissLobbyInvite(lobbyID);
                    return;
                }

                if (message.type === "lobby_closed")
                {
                    if (typeof message.lobby_id !== "number")
                        return;

                    const lobbyID = String(message.lobby_id);
                    markLobbyChanged(lobbyID);
                    setLobbies(previous =>
                    {
                        if (!previous[lobbyID])
                            return previous;
                        const next = { ...previous };
                        delete next[lobbyID];
                        return next;
                    });
                    dismissLobbyInvite(lobbyID);
                    return;
                }

                if (message.type === "lobby_invite")
                {
                    if (
                        typeof message.lobby_id !== "number" ||
                        typeof message.lobby_name !== "string" ||
                        typeof message.inviter !== "object" ||
                        message.inviter === null
                    )
                        return;

                    const invite: LobbyInvite = {
                        lobby_id: message.lobby_id,
                        lobby_name: message.lobby_name,
                        inviter: message.inviter as PublicUser,
                    };

                    inviteRevisionsRef.current[String(invite.lobby_id)] = ++inviteVersionRef.current;
                    setLobbyInvites(previous => [
                        ...previous.filter(existing => existing.lobby_id !== invite.lobby_id),
                        invite,
                    ]);
                    return;
                }

                if(message.type === "lobby_start")
                {
                    if (
                      typeof message.lobby_id !== "number" ||
                      typeof message.game !== "object" ||
                      message.game === null
                    )
                        return;

                    const lobbyGame = message.game as ILobbyGame;
                    if (typeof lobbyGame.game_session_id !== "string")
                        return;

                    setStartedMultiGame({
                        lobbyId: String(message.lobby_id),
                        gameSessionId: lobbyGame.game_session_id,
                    });
                    return;
                }

                // chat_message and conversation_read belong to the chat context.
            });

            socket.addEventListener("close", event =>
            {
                if (isCurrent && event.code !== 1008)
                    reconnectTimeoutID = window.setTimeout(connect, 3000);
            });
        }

        connect();

        return () =>
        {
            isCurrent = false;
            window.clearTimeout(reconnectTimeoutID);
            socket?.close();
        };
    }, [auth.status, auth.accessToken, auth.user?.id, refreshLobbies, markLobbyChanged, dismissLobbyInvite]);

    return (
        <LobbiesContext.Provider value={{
            lobbies,
            lobbyInvites,
            startedMultiGame,
            resetLobbies,
            refreshLobbies,
            loadLobby,
            createLobby,
            closeLobby,
            joinLobby,
            leaveLobby,
            lobbyStartGame,
            inviteFriend,
            dismissLobbyInvite,
            getChatHistory,
            addChatHistory,
            clearStartedMultiGame,
        }}>
            {children}
        </LobbiesContext.Provider>
    );
}

export function useLobbies()
{
    const context = useContext(LobbiesContext);
    if (!context)
        throw new Error("useLobbies() must be used within a LobbiesProvider");
    return context;
}
