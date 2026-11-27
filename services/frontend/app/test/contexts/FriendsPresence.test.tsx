import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import FriendsProvider, { useFriends } from "../../src/contexts/FriendsContext";
import WebSocketProvider from "../../src/contexts/WebSocketContext";
import type { FriendListResponse, FriendRequestResponse } from "../../src/api/friendsApi";

const authMock = vi.hoisted(() => ({
    current: {
        auth: {
            status: "authenticated" as "authenticated" | "unauthenticated",
            accessToken: "token" as string | null,
            user: { id: 1, username: "alice" as string | null },
        },
    },
}));

const apiMock = vi.hoisted(() => ({
    getFriends: vi.fn(),
    getIncomingFriendRequests: vi.fn(),
    getOutgoingFriendRequests: vi.fn(),
    removeFriend: vi.fn(),
}));

const chatMock = vi.hoisted(() => ({
    addChatHistoryEntry: vi.fn(),
    removeChatHistoryEntry: vi.fn(),
}));

vi.mock("../../src/contexts/AuthContext", () => ({
    useAuth: () => authMock.current,
}));

vi.mock("../../src/contexts/ChatHistoryContext", () => ({
    useChatHistory: () => chatMock,
}));

vi.mock("../../src/api/friendsApi", async (importOriginal) => ({
    ...await importOriginal<typeof import("../../src/api/friendsApi")>(),
    ...apiMock,
}));

vi.mock("../../src/api/http", () => ({
    getWsUrl: (path: string) => `ws://localhost:8000${path}`,
}));

class MockWebSocket extends EventTarget
{
    static instances: MockWebSocket[] = [];

    constructor()
    {
        super();
        MockWebSocket.instances.push(this);
    }

    open()
    {
        this.dispatchEvent(new Event("open"));
    }

    receivePresenceChange()
    {
        this.dispatchEvent(new MessageEvent("message", {
            data: JSON.stringify({ type: "friend_presence_changed" }),
        }));
    }

    disconnect()
    {
        this.dispatchEvent(new CloseEvent("close", { code: 1006 }));
    }

    close() {}
}

function friendList(isOnline: boolean): FriendListResponse
{
    return {
        friends: [{
            id: 1,
            friend: {
                id: 2,
                username: "bob",
                display_name: "Bob",
                avatar_url: null,
            },
            created_at: "2026-11-26T00:00:00Z",
            is_online: isOnline,
        }],
    };
}

function pendingRequest(id: number, requesterID: number): FriendRequestResponse
{
    return {
        id,
        requester: {
            id: requesterID,
            username: `user${requesterID}`,
            display_name: `User ${requesterID}`,
            avatar_url: null,
        },
        recipient: { id: 1, username: "alice", display_name: "Alice", avatar_url: null },
        status: "pending",
        created_at: "2026-11-26T00:00:00Z",
        responded_at: null,
    };
}

function deferred<T>()
{
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
}

describe("Friends presence", () =>
{
    let container: HTMLDivElement;
    let root: Root;
    let context: ReturnType<typeof useFriends>;

    function Inspector()
    {
        context = useFriends();
        return null;
    }

    async function render()
    {
        await act(async () =>
        {
            root.render(
                <WebSocketProvider>
                    <FriendsProvider><Inspector/></FriendsProvider>
                </WebSocketProvider>
            );
        });
    }

    beforeEach(() =>
    {
        vi.clearAllMocks();
        authMock.current.auth.status = "authenticated";
        authMock.current.auth.accessToken = "token";
        authMock.current.auth.user.username = "alice";
        apiMock.getFriends.mockReset().mockResolvedValue(friendList(false));
        apiMock.getIncomingFriendRequests.mockReset().mockResolvedValue([]);
        apiMock.getOutgoingFriendRequests.mockReset().mockResolvedValue([]);
        apiMock.removeFriend.mockReset().mockResolvedValue(undefined);
        MockWebSocket.instances = [];
        vi.stubGlobal("WebSocket", MockWebSocket);
        vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
        container = document.createElement("div");
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () =>
    {
        await act(async () => { root.unmount(); });
        container.remove();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it("waits for username setup before loading friends or subscribing", async () =>
    {
        authMock.current.auth.user.username = null;
        await render();
        await act(async () => { await context.refreshFriends(); });

        expect(apiMock.getFriends).not.toHaveBeenCalled();
        expect(apiMock.getIncomingFriendRequests).not.toHaveBeenCalled();
        expect(apiMock.getOutgoingFriendRequests).not.toHaveBeenCalled();
        expect(MockWebSocket.instances).toHaveLength(0);

        authMock.current.auth.user.username = "alice";
        await render();

        expect(apiMock.getFriends).toHaveBeenCalledTimes(1);
        expect(apiMock.getIncomingFriendRequests).toHaveBeenCalledTimes(1);
        expect(apiMock.getOutgoingFriendRequests).toHaveBeenCalledTimes(1);
        expect(MockWebSocket.instances).toHaveLength(1);
        expect(context.friends["2"].isOnline).toBe(false);
    });

    it("updates presence with only GET /friends and without polling", async () =>
    {
        vi.useFakeTimers();
        await render();
        const socket = MockWebSocket.instances[0];
        expect(context.friends["2"].isOnline).toBe(false);
        expect(MockWebSocket.instances).toHaveLength(1);
        expect(apiMock.getFriends).toHaveBeenCalledTimes(1);
        expect(apiMock.getIncomingFriendRequests).toHaveBeenCalledTimes(1);
        expect(apiMock.getOutgoingFriendRequests).toHaveBeenCalledTimes(1);

        apiMock.getFriends.mockResolvedValue(friendList(true));
        await act(async () => { socket.receivePresenceChange(); });
        expect(context.friends["2"].isOnline).toBe(true);

        apiMock.getFriends.mockResolvedValue(friendList(false));
        await act(async () => { socket.receivePresenceChange(); });
        expect(context.friends["2"].isOnline).toBe(false);

        expect(apiMock.getFriends).toHaveBeenCalledTimes(3);
        expect(apiMock.getIncomingFriendRequests).toHaveBeenCalledTimes(1);
        expect(apiMock.getOutgoingFriendRequests).toHaveBeenCalledTimes(1);

        await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
        expect(apiMock.getFriends).toHaveBeenCalledTimes(3);
        expect(apiMock.getIncomingFriendRequests).toHaveBeenCalledTimes(1);
        expect(apiMock.getOutgoingFriendRequests).toHaveBeenCalledTimes(1);
    });

    it("refreshes the snapshot when the socket reconnects", async () =>
    {
        vi.useFakeTimers();
        await render();

        await act(async () =>
        {
            MockWebSocket.instances[0].disconnect();
            await vi.advanceTimersByTimeAsync(3000);
        });

        apiMock.getFriends.mockResolvedValue(friendList(true));
        apiMock.getIncomingFriendRequests.mockResolvedValue([pendingRequest(7, 3)]);
        await act(async () => { MockWebSocket.instances[1].open(); });
        expect(context.friends["2"].isOnline).toBe(true);
        expect(context.incomingRequests.map(request => request.requestId)).toEqual([7]);
        expect(apiMock.getFriends).toHaveBeenCalledTimes(2);
        expect(apiMock.getIncomingFriendRequests).toHaveBeenCalledTimes(2);
        expect(apiMock.getOutgoingFriendRequests).toHaveBeenCalledTimes(2);
    });

    it("ignores an older response that arrives after a newer presence refresh", async () =>
    {
        await render();
        const stale = deferred<FriendListResponse>();
        apiMock.getFriends.mockReturnValueOnce(stale.promise);
        const socket = MockWebSocket.instances[0];

        await act(async () => { socket.receivePresenceChange(); });
        apiMock.getFriends.mockResolvedValue(friendList(true));
        await act(async () => { socket.receivePresenceChange(); });
        expect(context.friends["2"].isOnline).toBe(true);

        await act(async () => { stale.resolve(friendList(false)); });
        expect(context.friends["2"].isOnline).toBe(true);
    });

    it("keeps pending-request results from a full refresh when a presence event overlaps", async () =>
    {
        await render();
        const staleFriends = deferred<FriendListResponse>();
        const incoming = deferred<FriendRequestResponse[]>();
        apiMock.getFriends.mockReturnValueOnce(staleFriends.promise);
        apiMock.getIncomingFriendRequests.mockReturnValueOnce(incoming.promise);

        let fullRefresh!: Promise<void>;
        await act(async () => { fullRefresh = context.refreshFriends(); });

        apiMock.getFriends.mockResolvedValue(friendList(true));
        await act(async () => { MockWebSocket.instances[0].receivePresenceChange(); });
        expect(context.friends["2"].isOnline).toBe(true);
        expect(apiMock.getIncomingFriendRequests).toHaveBeenCalledTimes(2);

        await act(async () =>
        {
            incoming.resolve([pendingRequest(7, 3)]);
            staleFriends.resolve(friendList(false));
            await fullRefresh;
        });

        // The presence refresh supersedes only the friends-list snapshot,
        // not valid pending requests fetched by the earlier full refresh.
        expect(context.friends["2"].isOnline).toBe(true);
        expect(context.incomingRequests.map(request => request.requestId)).toEqual([7]);
    });

    it("ignores pending requests from an older full refresh", async () =>
    {
        await render();
        const staleIncoming = deferred<FriendRequestResponse[]>();
        apiMock.getIncomingFriendRequests.mockReturnValueOnce(staleIncoming.promise);

        let olderRefresh!: Promise<void>;
        await act(async () => { olderRefresh = context.refreshFriends(); });

        apiMock.getIncomingFriendRequests.mockResolvedValue([pendingRequest(8, 4)]);
        await act(async () => { await context.refreshFriends(); });

        await act(async () =>
        {
            staleIncoming.resolve([pendingRequest(7, 3)]);
            await olderRefresh;
        });

        expect(context.incomingRequests.map(request => request.requestId)).toEqual([8]);
    });

    it("does not restore a removed friend from an earlier presence refresh", async () =>
    {
        await render();
        const stale = deferred<FriendListResponse>();
        apiMock.getFriends.mockReturnValueOnce(stale.promise);
        await act(async () => { MockWebSocket.instances[0].receivePresenceChange(); });

        apiMock.getFriends.mockResolvedValue({ friends: [] });
        await act(async () => { await context.removeFriend("2"); });
        await act(async () => { stale.resolve(friendList(true)); });
        expect(context.friends["2"]).toBeUndefined();
    });

    it("drops in-flight presence results and subscriptions on logout", async () =>
    {
        await render();
        const stale = deferred<FriendListResponse>();
        apiMock.getFriends.mockReturnValueOnce(stale.promise);
        const incoming = deferred<FriendRequestResponse[]>();
        apiMock.getIncomingFriendRequests.mockReturnValueOnce(incoming.promise);
        const socket = MockWebSocket.instances[0];
        let fullRefresh!: Promise<void>;
        await act(async () => { fullRefresh = context.refreshFriends(); });

        authMock.current.auth.status = "unauthenticated";
        authMock.current.auth.accessToken = null;
        await render();

        const requestCount = apiMock.getFriends.mock.calls.length;
        await act(async () =>
        {
            stale.resolve(friendList(true));
            incoming.resolve([pendingRequest(7, 3)]);
            await fullRefresh;
            socket.receivePresenceChange();
        });
        expect(context.friends).toEqual({});
        expect(context.incomingRequests).toEqual([]);
        expect(apiMock.getFriends).toHaveBeenCalledTimes(requestCount);
    });

    it("reconciles removed friends' chat entries and selections during passive refreshes", async () =>
    {
        const initial = friendList(false);
        const anotherFriend = {
            ...initial.friends[0],
            id: 2,
            friend: {
                id: 3,
                username: "carol",
                display_name: "Carol",
                avatar_url: null,
            },
        };
        apiMock.getFriends.mockResolvedValue({ friends: [...initial.friends, anotherFriend] });
        await render();
        await act(async () =>
        {
            context.setActiveFriendID("2");
            context.setSelectedFriendID("2");
        });

        apiMock.getFriends.mockResolvedValue({ friends: [anotherFriend] });
        await act(async () => { MockWebSocket.instances[0].receivePresenceChange(); });

        expect(context.friends["2"]).toBeUndefined();
        expect(context.friends["3"]).toBeDefined();
        expect(context.activeFriendID).toBeUndefined();
        expect(context.selectedFriendID).toBeUndefined();
        expect(chatMock.removeChatHistoryEntry).toHaveBeenCalledExactlyOnceWith("2");

        await act(async () => { MockWebSocket.instances[0].receivePresenceChange(); });
        expect(chatMock.removeChatHistoryEntry).toHaveBeenCalledTimes(1);

        // Re-adding the friend should initialize its chat again.
        chatMock.addChatHistoryEntry.mockClear();
        apiMock.getFriends.mockResolvedValue({ friends: [...initial.friends, anotherFriend] });
        await act(async () => { MockWebSocket.instances[0].receivePresenceChange(); });
        expect(context.friends["2"]).toBeDefined();
        expect(chatMock.addChatHistoryEntry).toHaveBeenCalledWith("2");
    });

    it("retries a failed presence refresh without fetching pending requests", async () =>
    {
        vi.useFakeTimers();
        apiMock.getFriends.mockResolvedValue(friendList(true));
        await render();

        apiMock.getFriends.mockRejectedValueOnce(new Error("Temporary network failure"));
        apiMock.getFriends.mockResolvedValue(friendList(false));
        await act(async () => { MockWebSocket.instances[0].receivePresenceChange(); });

        // Keep existing status while the first refresh fails.
        expect(context.friends["2"].isOnline).toBe(true);
        expect(apiMock.getFriends).toHaveBeenCalledTimes(2);

        await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
        expect(context.friends["2"].isOnline).toBe(false);
        expect(apiMock.getFriends).toHaveBeenCalledTimes(3);
        expect(apiMock.getIncomingFriendRequests).toHaveBeenCalledTimes(1);
        expect(apiMock.getOutgoingFriendRequests).toHaveBeenCalledTimes(1);

        await act(async () => { await vi.advanceTimersByTimeAsync(60000); });
        expect(apiMock.getFriends).toHaveBeenCalledTimes(3);
    });

    it("stops after two retries if presence refreshes continue failing", async () =>
    {
        vi.useFakeTimers();
        const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
        apiMock.getFriends.mockResolvedValue(friendList(true));
        await render();

        apiMock.getFriends.mockRejectedValue(new Error("Backend unavailable"));
        await act(async () => { MockWebSocket.instances[0].receivePresenceChange(); });
        await act(async () => { await vi.advanceTimersByTimeAsync(60000); });

        // Initial login fetch + event fetch + two retries. No polling.
        expect(apiMock.getFriends).toHaveBeenCalledTimes(4);
        expect(context.friends["2"].isOnline).toBe(true);
        expect(warning).toHaveBeenCalledTimes(1);
    });

    it("does not retry an outdated failure after a newer presence refresh succeeds", async () =>
    {
        vi.useFakeTimers();
        await render();
        const stale = deferred<FriendListResponse>();
        apiMock.getFriends.mockReturnValueOnce(stale.promise);
        await act(async () => { MockWebSocket.instances[0].receivePresenceChange(); });

        apiMock.getFriends.mockResolvedValue(friendList(true));
        await act(async () => { MockWebSocket.instances[0].receivePresenceChange(); });
        await act(async () => { stale.reject(new Error("Outdated request")); });
        await act(async () => { await vi.advanceTimersByTimeAsync(60000); });

        expect(context.friends["2"].isOnline).toBe(true);
        expect(apiMock.getFriends).toHaveBeenCalledTimes(3);
    });

    it("supersedes a scheduled presence retry with a newer full refresh", async () =>
    {
        vi.useFakeTimers();
        await render();

        apiMock.getFriends.mockRejectedValueOnce(new Error("Temporary network failure"));
        await act(async () => { MockWebSocket.instances[0].receivePresenceChange(); });

        apiMock.getFriends.mockResolvedValue(friendList(true));
        await act(async () => { await context.refreshFriends(); });
        await act(async () => { await vi.advanceTimersByTimeAsync(60000); });

        expect(context.friends["2"].isOnline).toBe(true);
        expect(apiMock.getFriends).toHaveBeenCalledTimes(3);
    });

    it("cancels a scheduled presence retry on logout", async () =>
    {
        vi.useFakeTimers();
        await render();

        apiMock.getFriends.mockRejectedValueOnce(new Error("Temporary network failure"));
        await act(async () => { MockWebSocket.instances[0].receivePresenceChange(); });
        authMock.current.auth.status = "unauthenticated";
        authMock.current.auth.accessToken = null;
        await render();
        await act(async () => { await vi.advanceTimersByTimeAsync(60000); });

        expect(context.friends).toEqual({});
        expect(apiMock.getFriends).toHaveBeenCalledTimes(2);
    });

    it("does not schedule a retry when an in-flight presence refresh fails after logout", async () =>
    {
        vi.useFakeTimers();
        await render();
        const stale = deferred<FriendListResponse>();
        apiMock.getFriends.mockReturnValueOnce(stale.promise);
        await act(async () => { MockWebSocket.instances[0].receivePresenceChange(); });

        authMock.current.auth.status = "unauthenticated";
        authMock.current.auth.accessToken = null;
        await render();

        await act(async () => { stale.reject(new Error("Previous session")); });
        await act(async () => { await vi.advanceTimersByTimeAsync(60000); });
        expect(context.friends).toEqual({});
        expect(apiMock.getFriends).toHaveBeenCalledTimes(2);
    });

    it("reports successful deletion even when its follow-up refresh fails", async () =>
    {
        const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
        await render();
        const stale = deferred<FriendListResponse>();
        apiMock.getFriends.mockReturnValueOnce(stale.promise);
        await act(async () => { MockWebSocket.instances[0].receivePresenceChange(); });

        apiMock.getFriends.mockRejectedValueOnce(new Error("Temporary network failure"));
        await act(async () =>
        {
            await expect(context.removeFriend("2")).resolves.toBeUndefined();
        });

        expect(apiMock.removeFriend).toHaveBeenCalledWith(2, "token");
        expect(context.friends["2"]).toBeUndefined();
        expect(chatMock.removeChatHistoryEntry).toHaveBeenCalledWith("2");
        expect(warning).toHaveBeenCalledTimes(1);

        await act(async () => { stale.resolve(friendList(true)); });
        expect(context.friends["2"]).toBeUndefined();
    });

    it("does not hide a failed DELETE or remove the friend locally", async () =>
    {
        await render();
        apiMock.removeFriend.mockRejectedValueOnce(new Error("DELETE failed"));
        await act(async () =>
        {
            await expect(context.removeFriend("2")).rejects.toThrow("DELETE failed");
        });

        expect(context.friends["2"]).toBeDefined();
        expect(chatMock.removeChatHistoryEntry).not.toHaveBeenCalled();
        expect(apiMock.getFriends).toHaveBeenCalledTimes(1);
    });

    it("keeps a different friend selected while a removal is in flight", async () =>
    {
        const initial = friendList(false);
        const anotherFriend = {
            ...initial.friends[0],
            id: 2,
            friend: {
                id: 3,
                username: "carol",
                display_name: "Carol",
                avatar_url: null,
            },
        };
        apiMock.getFriends.mockResolvedValue({ friends: [...initial.friends, anotherFriend] });
        await render();
        await act(async () =>
        {
            context.setActiveFriendID("2");
            context.setSelectedFriendID("2");
        });

        const deletion = deferred<void>();
        apiMock.removeFriend.mockReturnValueOnce(deletion.promise);
        let removal!: Promise<void>;
        await act(async () => { removal = context.removeFriend("2"); });
        await act(async () =>
        {
            context.setActiveFriendID("3");
            context.setSelectedFriendID("3");
        });

        apiMock.getFriends.mockResolvedValue({ friends: [anotherFriend] });
        await act(async () =>
        {
            deletion.resolve(undefined);
            await removal;
        });

        expect(context.friends["2"]).toBeUndefined();
        expect(context.activeFriendID).toBe("3");
        expect(context.selectedFriendID).toBe("3");
    });
});
