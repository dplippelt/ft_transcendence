import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import type { NavigateFunction } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PublicProfile from "../../src/pages/Profile/PublicProfile";
import { ApiError } from "../../src/api/http";
import type { PublicUser } from "../../src/api/friendsApi";
import type { IFriendData, IFriendRequestData } from "../../src/contexts/FriendsContext";
import { RoutePath } from "../../src/utils/utils";

const mocks = vi.hoisted(() => ({
    getUserProfile: vi.fn(),
    friends: {} as Record<string, IFriendData>,
    incomingRequests: [] as IFriendRequestData[],
    outgoingRequests: [] as IFriendRequestData[],
}));

vi.mock("../../src/api/usersApi", () => ({
    getUserProfile: mocks.getUserProfile,
}));

vi.mock("../../src/contexts/AuthContext", () => ({
    useAuth: () => ({ auth: { accessToken: "token" } }),
    useCurrentUser: () => ({ id: 1, username: "alice" }),
}));

vi.mock("../../src/contexts/FriendsContext", () => ({
    useFriends: () => ({
        friends: mocks.friends,
        incomingRequests: mocks.incomingRequests,
        outgoingRequests: mocks.outgoingRequests,
    }),
}));

// The page itself is under test; unrelated shared button dependencies are not.
vi.mock("../../src/components/Buttons", () => ({
    BackButton: () => <button type="button">Back</button>,
}));

const player: PublicUser = {
    id: 2,
    username: "bob",
    display_name: "Bob",
    avatar_url: null,
};

describe("PublicProfile", () =>
{
    let container: HTMLDivElement;
    let root: Root;
    let navigate: NavigateFunction;

    function TestRoutes()
    {
        navigate = useNavigate();
        return (
            <Routes>
                <Route path={RoutePath.playerProfile} element={<PublicProfile/>}/>
                <Route path={RoutePath.profile} element={<div>My account</div>}/>
            </Routes>
        );
    }

    async function render(path: string)
    {
        await act(async () =>
        {
            root.render(
                <MemoryRouter initialEntries={[path]}>
                    <TestRoutes/>
                </MemoryRouter>
            );
        });
    }

    beforeEach(() =>
    {
        mocks.getUserProfile.mockReset().mockResolvedValue(player);
        mocks.friends = {};
        mocks.incomingRequests = [];
        mocks.outgoingRequests = [];
        vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
        container = document.createElement("div");
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () =>
    {
        await act(async () => { root.unmount(); });
        container.remove();
        vi.unstubAllGlobals();
    });

    it("shows a public profile without exposing a non-friend's presence", async () =>
    {
        await render("/profile/2");

        expect(container.textContent).toContain("bob");
        expect(container.textContent).toContain("Bob");
        expect(container.textContent).toContain("Not friends");
        expect(container.textContent).not.toContain("Status:");
        expect(mocks.getUserProfile).toHaveBeenCalledExactlyOnceWith(2, "token");
    });

    it("displays current friend presence and updates it without refetching the profile", async () =>
    {
        const friend = { username: "Bob", avatar: "avatar.png", isOnline: false };
        mocks.friends = { "2": friend };
        await render("/profile/2");

        expect(container.textContent).toContain("Status:");
        expect(container.textContent).toContain("Offline");

        mocks.friends = { "2": { ...friend, isOnline: true } };
        await render("/profile/2");
        expect(container.textContent).toContain("Online");
        expect(container.textContent).not.toContain("Offline");
        expect(mocks.getUserProfile).toHaveBeenCalledTimes(1);

        mocks.friends = {};
        await render("/profile/2");
        expect(container.textContent).toContain("Not friends");
        expect(container.textContent).not.toContain("Status:");
    });

    it("redirects to the account page for the current user's own ID", async () =>
    {
        await render("/profile/1");

        expect(container.textContent).toContain("My account");
        expect(mocks.getUserProfile).not.toHaveBeenCalled();
    });

    it.each(["0", "-2", "abc", "9007199254740992"])("rejects an invalid player ID (%s) without requesting the API", async (id) =>
    {
        await render(`/profile/${id}`);

        expect(container.textContent).toContain("Invalid player ID");
        expect(mocks.getUserProfile).not.toHaveBeenCalled();
    });

    it("shows a not-found message for a nonexistent player", async () =>
    {
        mocks.getUserProfile.mockRejectedValueOnce(new ApiError(404, "User not found"));
        await render("/profile/2");

        expect(container.querySelector('[role="alert"]')?.textContent).toBe("Player not found");
        expect(container.textContent).not.toContain("Loading profile...");
    });

    it("distinguishes network failure from a nonexistent user", async () =>
    {
        mocks.getUserProfile.mockRejectedValueOnce(new Error("Network unavailable"));
        await render("/profile/2");

        expect(container.querySelector('[role="alert"]')?.textContent).toBe("Unable to load player profile");
    });

    it("ignores a late profile response after navigating to another player", async () =>
    {
        let resolve!: (value: PublicUser) => void;
        const oldProfile = new Promise<PublicUser>(callback => { resolve = callback; });
        mocks.getUserProfile.mockReturnValueOnce(oldProfile);

        await render("/profile/2");
        expect(container.textContent).toContain("Loading profile...");
        mocks.getUserProfile.mockResolvedValue({ id: 3, username: "carol", display_name: "Carol", avatar_url: null });

        await act(async () => { navigate("/profile/3"); });
        expect(container.textContent).toContain("Carol");

        await act(async () => { resolve(player); });
        expect(container.textContent).toContain("Carol");
        expect(container.textContent).not.toContain("Bob");
    });
});
