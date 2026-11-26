import {
    createContext,
    useContext,
    useCallback,
    useRef,
    useEffect,
    useMemo
} from "react";
import type { ReactNode } from "react";

import { useAuth } from "./AuthContext";
import { ApiError, getWsUrl } from "../api/http";
import { getWebSocketTicket } from "../api/authApi";

// The structure of a message received from the backend
// Unknown instead of any -> force to check the type before using the value
export interface WebSocketMessage
{
    type: string;
    [key: string]: unknown;
}

type MessageHandler = (message: WebSocketMessage) => void | Promise<void>;
type OpenHandler = () => void | Promise<void>;

// This defines what other contexts are allowed to access, they can only register their interest in events e.g handle message or open socket
interface IWebSocketContext
{
    // Handlers may be synchronous or asynchronous. Return asynchronous operations to let the provider handle rejected Promises
    //  Unsubscribing prevents future handler executions, but does not cancel operations already in progress
    subscribe: (
        type: string,
        handler: MessageHandler
    ) => () => void;

    // Subscribe to connection-open events, including reconnections. The handler is not called immediately if the socket is already open
    subscribeOpen: (handler: OpenHandler) => () => void;
}

const WebSocketContext = createContext<IWebSocketContext | null>(null);

export default function WebSocketProvider({ children }: { children: ReactNode })
{
    const { auth } = useAuth();
    // This acts as a registry of event listeners, key is an event type, the value is a collection of functions
    // We can look up the relevant handlers directly using the message type via Map
    // Multiple components can subscribe to the same event without overwrite each other's callback. Set prevents registering twice
    const messageHandlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());
    const openHandlersRef = useRef<Set<OpenHandler>>(new Set());
    const subscribe = useCallback((type: string, handler: MessageHandler) =>
    {
        const handlers = messageHandlersRef.current;
        if (!handlers.has(type))
            handlers.set(type, new Set());

        const subscribers = handlers.get(type)!;
        subscribers.add(handler);
        return () =>
        {
            subscribers.delete(handler);

            if (subscribers.size === 0 && handlers.get(type) === subscribers)
                handlers.delete(type);
        };
    }, []);

    const subscribeOpen = useCallback((handler: OpenHandler) =>
    {
        openHandlersRef.current.add(handler);

        return () =>
        {
            openHandlersRef.current.delete(handler);
        };
    }, []);

    useEffect(() =>
    {
        const accessToken = auth.accessToken;
        if (auth.status !== "authenticated" || !accessToken || auth.user?.id === undefined || !auth.user.username)
            return;
    
        let socket: WebSocket | null = null;
        let reconnectTimeoutID: number | undefined;
        let isCurrent = true; // indicates whether this effect is still active
        const abortController = new AbortController();

        function scheduleReconnect(token: string)
        {
            if (!isCurrent)
                return;
            reconnectTimeoutID = window.setTimeout(
                () => void connect(token),
                3000
            );
        }

        async function connect(token: string)
        {
            if (!isCurrent)
                return;
            let connection: WebSocket;
            try
            {
                // Every connection attempt needs a fresh, single-use ticket.
                // The access token is sent only in the HTTP Authorization header.
                const { ticket } = await getWebSocketTicket(token, abortController.signal);

                // Authentication may have changed while the request was in flight.
                if (!isCurrent)
                    return;

                connection = new WebSocket(getWsUrl(`/chat/ws?ticket=${encodeURIComponent(ticket)}`));
            }
            catch (error)
            {
                if (!isCurrent)
                    return;

                // Invalid or forbidden HTTP authentication cannot be fixed by
                // reconnecting with the same access token.
                if (error instanceof ApiError && (error.status === 401 || error.status === 403))
                {
                    console.warn("WebSocket authentication rejected");
                    return;
                }

                // Do not log the error object or URL: they may contain credentials.
                console.warn("WebSocket connection attempt failed");
                scheduleReconnect(token);
                return;
            }

            socket = connection;
            connection.addEventListener("open", () =>
            {
                if (!isCurrent || socket !== connection)
                    return;
    
                for (const handler of openHandlersRef.current)
                {
                    try
                    {
                        // inner .catch for asynchronous Promise rejection
                        void Promise.resolve(handler()).catch(error =>
                        {
                            console.error("WebSocket open handler failed", error);
                        });
                    }
                    catch (error) // for synchronous exception
                    {
                        console.error("WebSocket open handler failed", error);
                    }
                }
            });
    
            connection.addEventListener("message", event =>
            {
                if (!isCurrent || socket !== connection)
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
    
                if (typeof payload !== "object" || payload === null || !("type" in payload) || typeof payload.type !== "string")
                    return;
    
                const message = payload as WebSocketMessage;
                const handlers = messageHandlersRef.current.get(message.type);
    
                if (!handlers)
                    return;
    
                for (const handler of handlers)
                {
                    try
                    {
                        void Promise.resolve(handler(message)).catch(error =>
                        {
                            console.error("WebSocket message handler failed", error);
                        });
                    }
                    catch (error)
                    {
                        console.error("WebSocket message handler failed", error);
                    }
                }
            });
    
            connection.addEventListener("close", event =>
            {
                if (!isCurrent || socket !== connection)
                    return;

                socket = null;

                if (event.code !== 1008) // WebSocket policy violated
                    scheduleReconnect(token);
            });
        }
    
        void connect(accessToken);

        return () =>
        {
            isCurrent = false;
            abortController.abort();
            window.clearTimeout(reconnectTimeoutID);
            socket?.close();
        };
    }, [auth.status, auth.accessToken, auth.user?.id, auth.user?.username]);

    // Avoid unnecessarily notifying context consumers when the provider re-renders but its interface hasn't changed
    const value = useMemo(() => ({
        subscribe,
        subscribeOpen,
    }), [subscribe, subscribeOpen]);

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket(): IWebSocketContext
{
    const context = useContext(WebSocketContext);

    if (!context)
        throw new Error(
            "useWebSocket() must be used within WebSocketProvider"
        );

    return context;
}
