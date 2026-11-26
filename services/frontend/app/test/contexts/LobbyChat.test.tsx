// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import LobbiesProvider, { useLobbies } from "../../src/contexts/LobbiesContext";
import { LobbyChatHistory } from "../../src/components/Chat/ChatHistory";
import type { ILobbyMessageResponse, ILobbyResponse } from "../../src/api/lobbyApi";

const authMock = vi.hoisted(() => ({
    current: {
        auth: {
            status: "authenticated" as "authenticated" | "unauthenticated",
            accessToken: "token" as string | null,
            user: { id: 1, username: "alice" },
        },
    },
}));

const apiMock = vi.hoisted(() => ({
    getLobbies: vi.fn(),
    getLobbyMessages: vi.fn(),
    sendLobbyMessage: vi.fn(),
}));

const websocketMock = vi.hoisted(() => ({
    messages: new Map<string, Set<(message: Record<string, unknown>) => void>>(),
    open: new Set<() => void>(),
}));

vi.mock("../../src/contexts/AuthContext", () => ({
    useAuth: () => authMock.current,
}));

vi.mock("../../src/api/lobbyApi", async (importOriginal) => ({
    ...await importOriginal<typeof import("../../src/api/lobbyApi")>(),
    getLobbies: apiMock.getLobbies,
    getLobbyMessages: apiMock.getLobbyMessages,
    sendLobbyMessage: apiMock.sendLobbyMessage,
}));

// Keep the same function identities across renders, just like the real
// WebSocketProvider. New callbacks on each render make consumers' effects
// resubscribe and refetch indefinitely.
function subscribe(type: string, handler: (message: Record<string, unknown>) => void)
{
    const handlers = websocketMock.messages.get(type) ?? new Set();
    handlers.add(handler);
    websocketMock.messages.set(type, handlers);
    return () => { handlers.delete(handler); };
}

function subscribeOpen(handler: () => void)
{
    websocketMock.open.add(handler);
    return () => { websocketMock.open.delete(handler); };
}

vi.mock("../../src/contexts/WebSocketContext", () => ({
    useWebSocket: () => ({ subscribe, subscribeOpen }),
}));

const lobby: ILobbyResponse = {
    id: 7,
    name: "Test lobby",
    created_at: "2026-11-23T10:00:00Z",
    members: [
        {
            user: { id: 1, username: "alice", display_name: "Alice", avatar_url: null },
            role: "host",
            joined_at: "2026-11-23T10:00:00Z",
        },
        {
            user: { id: 2, username: "bob", display_name: "Bob", avatar_url: null },
            role: "guest",
            joined_at: "2026-11-23T10:00:00Z",
        },
    ],
};

function message(id: number, senderID = 1): ILobbyMessageResponse
{
    return {
        id,
        lobby_id: 7,
        sender: {
            id: senderID,
            username: senderID === 1 ? "alice" : "bob",
            display_name: senderID === 1 ? "Alice" : "Bob",
            avatar_url: null,
        },
        content: `message ${id}`,
        created_at: "2026-11-23T10:01:00Z",
    };
}

function deferred<T>()
{
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(callback => { resolve = callback; });
    return { promise, resolve };
}

let context: ReturnType<typeof useLobbies>;
let root: Root;
let container: HTMLDivElement;

function Inspector()
{
    context = useLobbies();
    return null;
}

async function render(chatHistory = false)
{
    await act(async () =>
    {
        root.render(
            <LobbiesProvider>
                <Inspector/>
                {chatHistory &&
                    <MemoryRouter initialEntries={["/lobbies/7"]}>
                        <Routes>
                            <Route path="/lobbies/:lobbyID" element={<LobbyChatHistory/>}/>
                        </Routes>
                    </MemoryRouter>
                }
            </LobbiesProvider>
        );
    });
}

function receive(messageData: ILobbyMessageResponse)
{
    act(() =>
    {
        websocketMock.messages.get("lobby_message")?.forEach(handler =>
            handler({ type: "lobby_message", ...messageData })
        );
    });
}

describe("Lobby chat integration", () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
        websocketMock.messages.clear();
        websocketMock.open.clear();
        authMock.current.auth.status = "authenticated";
        authMock.current.auth.accessToken = "token";
        apiMock.getLobbies.mockResolvedValue([lobby]);
        apiMock.getLobbyMessages.mockResolvedValue([]);
        apiMock.sendLobbyMessage.mockResolvedValue(message(1));
        vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(async () =>
    {
        await act(async () => { root.unmount(); });
        container.remove();
        vi.unstubAllGlobals();
    });

    it("adds the sender's saved HTTP response and receives the other player's WebSocket message", async () =>
    {
        await render();
        await act(async () => { await context.sendLobbyChatMessage("7", "message 1"); });

        expect(apiMock.sendLobbyMessage).toHaveBeenCalledWith(7, "message 1", "token");
        expect(context.getChatHistory("7")?.map(item => item.id)).toEqual([1]);

        receive(message(2, 2));
        receive(message(2, 2)); // Duplicate live notification.
        receive({ ...message(99), lobby_id: 10 }); // Another lobby.

        expect(context.getChatHistory("7")?.map(item => item.id)).toEqual([1, 2]);
    });

    it("merges a delayed history response with messages received while loading", async () =>
    {
        const pending = deferred<ILobbyMessageResponse[]>();
        apiMock.getLobbyMessages.mockReturnValueOnce(pending.promise);
        await render();

        let loading!: Promise<void>;
        await act(async () => { loading = context.loadLobbyMessages("7"); });
        receive(message(3, 2));

        await act(async () =>
        {
            pending.resolve([message(1), message(2, 2), message(3, 2)]);
            await loading;
        });

        expect(context.getChatHistory("7")?.map(item => item.id)).toEqual([1, 2, 3]);
    });

    it("loads history when the lobby chat mounts and after the shared WebSocket reconnects", async () =>
    {
        apiMock.getLobbyMessages
            .mockResolvedValueOnce([message(1)])
            .mockResolvedValueOnce([message(1), message(2, 2)]);

        await render(true);
        expect(apiMock.getLobbyMessages).toHaveBeenCalledTimes(1);
        expect(container.textContent).toContain("message 1");

        await act(async () =>
        {
            for (const handler of websocketMock.open)
                handler();
            await Promise.resolve();
        });

        expect(apiMock.getLobbyMessages).toHaveBeenCalledTimes(2);
        expect(context.getChatHistory("7")?.map(item => item.id)).toEqual([1, 2]);
        expect(container.textContent).toContain("message 2");
    });

    it("waits for the lobby to load before fetching chat history", async () =>
    {
        const pendingLobbies = deferred<ILobbyResponse[]>();
        apiMock.getLobbies.mockReturnValueOnce(pendingLobbies.promise);
        apiMock.getLobbyMessages.mockResolvedValueOnce([message(1)]);

        await render(true);
        expect(apiMock.getLobbyMessages).not.toHaveBeenCalled();

        await act(async () =>
        {
            pendingLobbies.resolve([lobby]);
            await pendingLobbies.promise;
        });

        expect(apiMock.getLobbyMessages).toHaveBeenCalledTimes(1);
        expect(container.textContent).toContain("message 1");
    });

    it("does not add a failed outgoing message", async () =>
    {
        await render();
        apiMock.sendLobbyMessage.mockRejectedValueOnce(new Error("offline"));

        let sendError: unknown;
        await act(async () =>
        {
            try
            {
                await context.sendLobbyChatMessage("7", "failed message");
            }
            catch (error)
            {
                sendError = error;
            }
        });

        expect(sendError).toBeInstanceOf(Error);
        expect(context.getChatHistory("7")).toEqual([]);
    });

    it("drops an in-flight history response after logout", async () =>
    {
        const pending = deferred<ILobbyMessageResponse[]>();
        apiMock.getLobbyMessages.mockReturnValueOnce(pending.promise);
        await render();

        let loading!: Promise<void>;
        await act(async () => { loading = context.loadLobbyMessages("7"); });
        await act(async () => { context.resetLobbies(); });
        await act(async () =>
        {
            pending.resolve([message(1)]);
            await loading;
        });

        expect(context.lobbies).toEqual({});
    });
});
