import { apiRequest } from "./http";
import type { PublicUser } from "./friendsApi";

export type LobbyRole = "host" | "guest";

export interface ILobbyMemberResponse
{
	user: PublicUser;
	role: LobbyRole;
	joined_at: string;
}

export interface ILobbyResponse
{
	id: number;
	name: string;
	created_at: string;
	members: ILobbyMemberResponse[];
}

export interface ILobbyMessageResponse
{
	id: number;
	lobby_id: number;
	sender: PublicUser;
	content: string;
	created_at: string;
}

export interface ILobbyInviteResponse
{
	delivered: boolean;
}

export function getLobbies(accessToken: string,): Promise<ILobbyResponse[]>
{
    return apiRequest<ILobbyResponse[]>("/lobbies", {}, accessToken);
}

export function getLobby(lobbyId: number, accessToken: string): Promise<ILobbyResponse>
{
    return apiRequest<ILobbyResponse>(`/lobbies/${lobbyId}`, {}, accessToken);
}

export function createLobby(name: string, accessToken: string): Promise<ILobbyResponse>
{
    return apiRequest<ILobbyResponse>("/lobbies",
        {
            method: "POST",
            body: JSON.stringify({ name }),
        },
        accessToken);
}

export function joinLobby(lobbyId: number, accessToken: string): Promise<ILobbyResponse>
{
    return apiRequest<ILobbyResponse>(`/lobbies/${lobbyId}/join`,
        {
            method: "POST"
        },
        accessToken);
}

export function leaveLobby(lobbyId: number, accessToken: string): Promise<void>
{
    return apiRequest<void>(`/lobbies/${lobbyId}/leave`,
        {
            method: "POST"
        },
        accessToken);
}

export function closeLobby(lobbyId: number, accessToken: string): Promise<void>
{
    return apiRequest<void>(`/lobbies/${lobbyId}`,
        {
            method: "DELETE"
        },
        accessToken);
}

export function getLobbyMessages(lobbyId: number, accessToken: string): Promise<ILobbyMessageResponse[]>
{
    return apiRequest<ILobbyMessageResponse[]>(`/lobbies/${lobbyId}/messages`, {}, accessToken);
}

export function sendLobbyMessage(lobbyId: number, content: string, accessToken: string): Promise<ILobbyMessageResponse>
{
    return apiRequest<ILobbyMessageResponse>(`/lobbies/${lobbyId}/messages`,
        {
            method: "POST",
            body: JSON.stringify({ content }),
        },
        accessToken);
}

export function inviteToLobby(lobbyId: number, friendId: number, accessToken: string): Promise<ILobbyInviteResponse>
{
    return apiRequest<ILobbyInviteResponse>(`/lobbies/${lobbyId}/invite`,
        {
            method: "POST",
            body: JSON.stringify({ friend_id: friendId }),
        },
        accessToken);
}
