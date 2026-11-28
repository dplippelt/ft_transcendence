import { act, StrictMode, useEffect } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import WebSocketProvider, {
    useWebSocket,
} from "../../src/contexts/WebSocketContext";
import type { WebSocketMessage } from "../../src/contexts/WebSocketContext";

type TestAuth = {
    auth: {
        status: "loading" | "authenticated" | "unauthenticated" | "error";
        accessToken: string | null;
        user: { id: number; username: string | null } | null;
    };
};

// Mock authentication state and the browser's network boundaries. Keep the
// real authApi/http helpers so the ticket request and ApiError handling are tested.
const authMock = vi.hoisted(() => ({
    current: {
        auth: {
            status: "authenticated",
            accessToken: "example token",
            user: { id: 7, username: "TestUser" },
        },
    } as TestAuth,
}));

vi.mock("../../src/contexts/AuthContext", () => ({
    useAuth: () => authMock.current,
}));

const fetchMock = vi.fn<typeof fetch>();

// Only the response fields read by apiRequest are needed. Resolve JSON without
// real network I/O or stream timers so reconnection timing stays deterministic.
function jsonResponse(data: unknown, status = 200): Response
{
    return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => data,
    } as Response;
}

function ticketResponse(ticket: string): Response
{
    return jsonResponse({ ticket, expires_in: 30 });
}

class MockWebSocket extends EventTarget
{
    static instances: MockWebSocket[] = [];

    readonly url: string;
    closeCount = 0;

    constructor(url: string)
    {
        super();
        this.url = url;
        MockWebSocket.instances.push(this);
    }

    open()
    {
        this.dispatchEvent(new Event("open"));
    }

    receive(payload: unknown)
    {
        this.receiveRaw(JSON.stringify(payload));
    }

    receiveRaw(data: string)
    {
        this.dispatchEvent(new MessageEvent("message", { data }));
    }

    disconnect(code = 1006)
    {
        this.dispatchEvent(new CloseEvent("close", { code }));
    }

    close()
    {
        this.closeCount += 1;
    }
}

type MessageHandler = (message: WebSocketMessage) => void | Promise<void>;
type OpenHandler = () => void | Promise<void>;

function Listener({
    eventType,
    onMessage,
    onOpen,
}: {
    eventType?: string;
    onMessage?: MessageHandler;
    onOpen?: OpenHandler;
})
{
    const { subscribe, subscribeOpen } = useWebSocket();

    useEffect(() =>
    {
        const unsubscribeMessage = eventType && onMessage
            ? subscribe(eventType, onMessage)
            : () => {};
        const unsubscribeOpen = onOpen
            ? subscribeOpen(onOpen)
            : () => {};

        return () =>
        {
            unsubscribeMessage();
            unsubscribeOpen();
        };
    }, [eventType, onMessage, onOpen, subscribe, subscribeOpen]);

    return null;
}

function deferred<T = void>()
{
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) =>
    {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

describe("WebSocketContext", () =>
{
    let container: HTMLDivElement;
    let root: Root;

    async function render(children: ReactNode = null)
    {
        await act(async () =>
        {
            root.render(<WebSocketProvider>{children}</WebSocketProvider>);
        });
    }

    function socket(index = 0)
    {
        const connection = MockWebSocket.instances[index];
        expect(connection).toBeDefined();
        return connection;
    }

    function expectTicketRequest(index: number, accessToken: string)
    {
        const [input, options] = fetchMock.mock.calls[index];
        const url = new URL(String(input));
        expect(url.pathname).toMatch(/\/auth\/ws-ticket$/);
        expect(url.search).toBe("");
        expect(options?.method).toBe("POST");
        expect(new Headers(options?.headers).get("Authorization")).toBe(`Bearer ${accessToken}`);
        expect(options?.signal).toBeDefined();
    }

    async function advanceTime(ms: number)
    {
        await act(async () =>
        {
            await vi.advanceTimersByTimeAsync(ms);
        });
    }

    beforeEach(() =>
    {
        authMock.current = {
            auth: {
                status: "authenticated",
                accessToken: "example token",
                user: { id: 7, username: "TestUser" },
            },
        };
        MockWebSocket.instances = [];
        fetchMock.mockReset();
        fetchMock.mockImplementation(async () =>
            ticketResponse(`example ticket ${fetchMock.mock.calls.length}`),
        );
        vi.stubGlobal("fetch", fetchMock);
        vi.stubGlobal("WebSocket", MockWebSocket);
        vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
        container = document.createElement("div");
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () =>
    {
        await act(async () =>
        {
            root.unmount();
        });
        container.remove();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it("opens one authenticated socket shared by multiple subscribers", async () =>
    {
        const onChat = vi.fn();
        const onLobby = vi.fn();
        await render(<>
            <Listener eventType="chat_message" onMessage={onChat}/>
            <Listener eventType="lobby_invite" onMessage={onLobby}/>
        </>);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expectTicketRequest(0, "example token");
        expect(MockWebSocket.instances).toHaveLength(1);
        const wsUrl = new URL(socket().url);
        expect(wsUrl.pathname).toMatch(/\/chat\/ws$/);
        expect(wsUrl.search).toBe("?ticket=example%20ticket%201");
        expect(wsUrl.searchParams.has("token")).toBe(false);

        act(() => socket().receive({ type: "lobby_invite", lobby_id: 12 }));
        expect(onLobby).toHaveBeenCalledTimes(1);
        expect(onChat).not.toHaveBeenCalled();

        act(() => socket().receive({ type: "chat_message", content: "hi" }));
        expect(onChat).toHaveBeenCalledTimes(1);
        expect(onLobby).toHaveBeenCalledTimes(1);
    });

    it("does not connect without a fully authenticated session", async () =>
    {
        authMock.current.auth = {
            status: "loading", accessToken: "example token", user: { id: 7, username: "TestUser" },
        };
        await render();
        expect(MockWebSocket.instances).toHaveLength(0);

        authMock.current.auth = {
            status: "authenticated", accessToken: null, user: { id: 7, username: "TestUser" },
        };
        await render();
        expect(MockWebSocket.instances).toHaveLength(0);

        authMock.current.auth = {
            status: "authenticated", accessToken: "example token", user: null,
        };
        await render();
        expect(MockWebSocket.instances).toHaveLength(0);
        expect(fetchMock).not.toHaveBeenCalled();

        authMock.current.auth = {
            status: "authenticated", accessToken: "example token", user: { id: 7, username: "TestUser" },
        };
        await render();
        expect(MockWebSocket.instances).toHaveLength(1);
    });

    it("waits for Google onboarding to finish before opening a socket", async () =>
    {
        authMock.current.auth = {
            status: "authenticated",
            accessToken: "example token",
            user: { id: 7, username: null },
        };
        await render();
        expect(MockWebSocket.instances).toHaveLength(0);
        expect(fetchMock).not.toHaveBeenCalled();

        authMock.current.auth = {
            status: "authenticated",
            accessToken: "example token",
            user: { id: 7, username: "TestUser" },
        };
        await render();
        expect(MockWebSocket.instances).toHaveLength(1);
    });

    it("ignores malformed JSON, missing type, and unregistered event types", async () =>
    {
        const onChat = vi.fn();
        await render(<Listener eventType="chat_message" onMessage={onChat}/>);

        act(() =>
        {
            socket().receiveRaw("{not JSON");
            socket().receive({ content: "missing type" });
            socket().receive({ type: 42 });
            socket().receive(null);
            socket().receive({ type: "unknown_event" });
        });

        expect(onChat).not.toHaveBeenCalled();
    });

    it("supports multiple handlers and unsubscribes on unmount", async () =>
    {
        const first = vi.fn();
        const second = vi.fn();
        await render(<>
            <Listener eventType="lobby_updated" onMessage={first}/>
            <Listener eventType="lobby_updated" onMessage={second}/>
        </>);

        act(() => socket().receive({ type: "lobby_updated" }));
        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);

        await render(<Listener eventType="lobby_updated" onMessage={second}/>);
        act(() => socket().receive({ type: "lobby_updated" }));
        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(2);

        await render();
        act(() => socket().receive({ type: "lobby_updated" }));
        expect(second).toHaveBeenCalledTimes(2);
    });

    it("notifies open subscribers on initial connection and reconnection", async () =>
    {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        const onOpen = vi.fn();
        await render(<Listener onOpen={onOpen}/>);

        act(() => socket().open());
        expect(onOpen).toHaveBeenCalledTimes(1);

        const oldSocket = socket();
        act(() => oldSocket.disconnect(1006));
        await advanceTime(2999);
        expect(MockWebSocket.instances).toHaveLength(1);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        await advanceTime(1);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expectTicketRequest(1, "example token");
        expect(MockWebSocket.instances).toHaveLength(2);
        expect(new URL(socket(1).url).searchParams.get("ticket")).toBe("example ticket 2");
        expect(socket(1).url).not.toBe(oldSocket.url);

        act(() => oldSocket.open()); // stale socket events must be ignored
        expect(onOpen).toHaveBeenCalledTimes(1);
        act(() => socket(1).open());
        expect(onOpen).toHaveBeenCalledTimes(2);
    });

    it("does not reconnect after policy-violation close code 1008", async () =>
    {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        await render();
        act(() => socket().disconnect(1008));
        await advanceTime(10000);
        expect(MockWebSocket.instances).toHaveLength(1);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("closes the old socket and ignores stale events on logout", async () =>
    {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        const onChat = vi.fn();
        await render(<Listener eventType="chat_message" onMessage={onChat}/>);
        const oldSocket = socket();

        authMock.current.auth = {
            status: "unauthenticated", accessToken: null, user: null,
        };
        await render(<Listener eventType="chat_message" onMessage={onChat}/>);
        expect(oldSocket.closeCount).toBe(1);

        act(() =>
        {
            oldSocket.receive({ type: "chat_message" });
            oldSocket.disconnect(1006);
        });
        await advanceTime(10000);
        expect(onChat).not.toHaveBeenCalled();
        expect(MockWebSocket.instances).toHaveLength(1);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("replaces the connection when the token changes", async () =>
    {
        await render();
        const oldSocket = socket();
        authMock.current.auth = {
            status: "authenticated", accessToken: "new-token", user: { id: 7, username: "TestUser" },
        };
        await render();

        expect(oldSocket.closeCount).toBe(1);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expectTicketRequest(1, "new-token");
        expect(MockWebSocket.instances).toHaveLength(2);
        expect(new URL(socket(1).url).search).toBe("?ticket=example%20ticket%202");
        expect(socket(1).url).not.toContain("new-token");
    });

    it("waits for the HTTP ticket before opening the WebSocket", async () =>
    {
        const pending = deferred<Response>();
        fetchMock.mockReturnValueOnce(pending.promise);

        await render();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expectTicketRequest(0, "example token");
        expect(MockWebSocket.instances).toHaveLength(0);

        await act(async () =>
        {
            pending.resolve(ticketResponse("issued-ticket"));
            await pending.promise;
        });

        expect(MockWebSocket.instances).toHaveLength(1);
        expect(new URL(socket().url).search).toBe("?ticket=issued-ticket");
    });

    it("aborts a pending ticket request on logout and ignores its late response", async () =>
    {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        const pending = deferred<Response>();
        fetchMock.mockReturnValueOnce(pending.promise);
        await render();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const signal = fetchMock.mock.calls[0][1]?.signal;
        expect(signal?.aborted).toBe(false);

        authMock.current.auth = {
            status: "unauthenticated", accessToken: null, user: null,
        };
        await render();
        expect(signal?.aborted).toBe(true);

        // Simulate a response that arrives despite the abort.
        await act(async () =>
        {
            pending.resolve(ticketResponse("stale-ticket"));
            await pending.promise;
        });
        await advanceTime(10000);
        expect(MockWebSocket.instances).toHaveLength(0);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("ignores an old ticket response when the access token changes", async () =>
    {
        const pending = deferred<Response>();
        fetchMock.mockReturnValueOnce(pending.promise);
        await render();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const signal = fetchMock.mock.calls[0][1]?.signal;
        expect(signal?.aborted).toBe(false);

        authMock.current.auth = {
            status: "authenticated", accessToken: "new-token", user: { id: 7, username: "TestUser" },
        };
        await render();

        expect(signal?.aborted).toBe(true);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expectTicketRequest(1, "new-token");
        expect(MockWebSocket.instances).toHaveLength(1);
        expect(new URL(socket().url).searchParams.get("ticket")).toBe("example ticket 2");

        await act(async () =>
        {
            pending.resolve(ticketResponse("stale-ticket"));
            await pending.promise;
        });
        expect(MockWebSocket.instances).toHaveLength(1);
    });

    it("cancels a scheduled reconnection on logout", async () =>
    {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        await render();

        act(() => socket().disconnect(1006));
        authMock.current.auth = {
            status: "unauthenticated", accessToken: null, user: null,
        };
        await render();

        await advanceTime(10000);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(MockWebSocket.instances).toHaveLength(1);
    });

    it("retries a temporarily failed ticket request after 3 seconds", async () =>
    {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        fetchMock.mockRejectedValueOnce(new Error("HTTP request failed"));
        await render();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(MockWebSocket.instances).toHaveLength(0);
        expect(warnSpy).toHaveBeenCalledWith("WebSocket connection attempt failed");

        await advanceTime(2999);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        await advanceTime(1);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expectTicketRequest(1, "example token");
        expect(MockWebSocket.instances).toHaveLength(1);
        expect(new URL(socket().url).searchParams.get("ticket")).toBe("example ticket 2");
    });

    it.each([401, 403])("does not retry ticket requests rejected with HTTP %i", async (status) =>
    {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        fetchMock.mockResolvedValueOnce(jsonResponse({ detail: "Authentication rejected" }, status));
        await render();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(MockWebSocket.instances).toHaveLength(0);
        expect(warnSpy).toHaveBeenCalledWith("WebSocket authentication rejected");

        await advanceTime(10000);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(MockWebSocket.instances).toHaveLength(0);
    });

    it("isolates synchronous and asynchronous message handler failures", async () =>
    {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const afterFailures = vi.fn();
        const syncFailure = () => { throw new Error("sync failed"); };
        const asyncFailure = async () => { throw new Error("async failed"); };

        await render(<>
            <Listener eventType="test_event" onMessage={syncFailure}/>
            <Listener eventType="test_event" onMessage={asyncFailure}/>
            <Listener eventType="test_event" onMessage={afterFailures}/>
        </>);

        await act(async () =>
        {
            socket().receive({ type: "test_event" });
            await Promise.resolve();
        });

        expect(afterFailures).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith(
            "WebSocket message handler failed", expect.any(Error),
        );
        expect(errorSpy).toHaveBeenCalledTimes(2);
    });

    it("isolates synchronous and asynchronous connection-open handler failures", async () =>
    {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const afterFailures = vi.fn();
        const syncFailure = () => { throw new Error("sync open failed"); };
        const asyncFailure = async () => { throw new Error("async open failed"); };

        await render(<>
            <Listener onOpen={syncFailure}/>
            <Listener onOpen={asyncFailure}/>
            <Listener onOpen={afterFailures}/>
        </>);

        await act(async () =>
        {
            socket().open();
            await Promise.resolve();
        });

        expect(afterFailures).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith(
            "WebSocket open handler failed", expect.any(Error),
        );
        expect(errorSpy).toHaveBeenCalledTimes(2);
    });

    it("dispatches overlapping async events without waiting for the first", async () =>
    {
        const firstRequest = deferred();
        const secondRequest = deferred();
        const onMessage = vi.fn()
            .mockImplementationOnce(() => firstRequest.promise)
            .mockImplementationOnce(() => secondRequest.promise);
        await render(<Listener eventType="friends_updated" onMessage={onMessage}/>);

        act(() =>
        {
            socket().receive({ type: "friends_updated" });
            socket().receive({ type: "friends_updated" });
        });
        expect(onMessage).toHaveBeenCalledTimes(2);

        // The provider does not order HTTP responses or prevent stale state:
        // that remains each consumer's responsibility.
        await act(async () => { secondRequest.resolve(); await secondRequest.promise; });
        await act(async () => { firstRequest.resolve(); await firstRequest.promise; });
    });

    it("unsubscribing prevents new calls but does not cancel in-flight work", async () =>
    {
        const work = deferred();
        const finished = vi.fn();
        const onMessage = vi.fn(() => work.promise.then(finished));
        await render(<Listener eventType="friends_updated" onMessage={onMessage}/>);

        act(() => socket().receive({ type: "friends_updated" }));
        expect(onMessage).toHaveBeenCalledTimes(1);

        await render(); // The listener unsubscribes while its Promise is pending.
        act(() => socket().receive({ type: "friends_updated" }));
        expect(onMessage).toHaveBeenCalledTimes(1);

        await act(async () => { work.resolve(); await work.promise; });
        expect(finished).toHaveBeenCalledTimes(1);
    });

    it("does not retain duplicate handlers after a Strict Mode effect remount", async () =>
    {
        const onMessage = vi.fn();
        await act(async () =>
        {
            root.render(
                <StrictMode>
                    <WebSocketProvider>
                        <Listener eventType="chat_message" onMessage={onMessage}/>
                    </WebSocketProvider>
                </StrictMode>,
            );
        });

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
        expect(MockWebSocket.instances).toHaveLength(1);
        act(() => socket().receive({ type: "chat_message" }));
        expect(onMessage).toHaveBeenCalledTimes(1);
    });

    it("logs a returned async rejection but does not retry business work", async () =>
    {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const failingRefresh = vi.fn(async () =>
        {
            throw new Error("HTTP refresh failed");
        });
        await render(<Listener eventType="friends_updated" onMessage={failingRefresh}/>);

        await act(async () =>
        {
            socket().receive({ type: "friends_updated" });
            await Promise.resolve();
        });

        expect(failingRefresh).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith(
            "WebSocket message handler failed", expect.any(Error),
        );
        // Retry policy belongs to the consumer, not the transport provider.
    });

    it("requires detached Promise errors to be handled by the consumer", async () =>
    {
        const providerErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const consumerErrorHandler = vi.fn();
        const work = deferred();

        // This callback returns void. The provider cannot see the Promise.
        // It is therefore essential for the consumer to attach its own catch.
        const onMessage = () =>
        {
            void work.promise.catch(consumerErrorHandler);
        };
        await render(<Listener eventType="friends_updated" onMessage={onMessage}/>);
        act(() => socket().receive({ type: "friends_updated" }));

        await act(async () =>
        {
            work.reject(new Error("detached failure"));
            await Promise.resolve();
        });
        expect(consumerErrorHandler).toHaveBeenCalledTimes(1);
        expect(providerErrorSpy).not.toHaveBeenCalled();
    });

    it("does not retroactively call a late open subscriber", async () =>
    {
        await render();
        act(() => socket().open());

        const lateOpen = vi.fn();
        await render(<Listener onOpen={lateOpen}/>);
        expect(lateOpen).not.toHaveBeenCalled();

        // This is the documented current contract: open callbacks run only
        // when a future connection/reconnection opens.
    });
});
