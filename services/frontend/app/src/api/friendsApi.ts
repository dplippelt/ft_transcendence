import { apiRequest } from "./http";

export interface PublicUser
{
    id: number;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
}

export interface FriendResponse
{
    id: number;
    friend: PublicUser;
    created_at: string;
}

export interface FriendListResponse
{
    friends: FriendResponse[];
}

export type FriendRequestStatus = "pending" | "accepted" | "rejected";

export interface FriendRequestResponse
{
    id: number;
    requester: PublicUser;
    recipient: PublicUser;
    status: FriendRequestStatus;
    created_at: string;
    responded_at: string | null;
}

export function getFriends(accessToken: string): Promise<FriendListResponse>
{
    return apiRequest<FriendListResponse>("/friends", {}, accessToken);
}

export function getIncomingFriendRequests(accessToken: string): Promise<FriendRequestResponse[]>
{
    return apiRequest<FriendRequestResponse[]>("/friends/requests/incoming", {}, accessToken);
}

export function getOutgoingFriendRequests(accessToken: string): Promise<FriendRequestResponse[]>
{
    return apiRequest<FriendRequestResponse[]>("/friends/requests/outgoing", {}, accessToken);
}

export function sendFriendRequest(username: string, accessToken: string): Promise<FriendRequestResponse>
{
    return apiRequest<FriendRequestResponse>("/friends/requests",
        {
            method: "POST",
            body: JSON.stringify({ username }),
        },
        accessToken,
    );
}

export function acceptFriendRequest(requestId: number, accessToken: string): Promise<FriendRequestResponse>
{
    return apiRequest<FriendRequestResponse>(`/friends/requests/${requestId}/accept`,
        { method: "POST" },
        accessToken,
    );
}

export function rejectFriendRequest(requestId: number, accessToken: string): Promise<FriendRequestResponse>
{
    return apiRequest<FriendRequestResponse>(`/friends/requests/${requestId}/reject`,
        { method: "POST" },
        accessToken,
    );
}

export function cancelFriendRequest(requestId: number, accessToken: string): Promise<void>
{
    return apiRequest<void>(`/friends/requests/${requestId}`,
        { method: "DELETE" },
        accessToken,
    );
}

export function removeFriend(friendId: number, accessToken: string): Promise<void>
{
    return apiRequest<void>(`/friends/${friendId}`,
        { method: "DELETE" },
        accessToken,
    );
}
