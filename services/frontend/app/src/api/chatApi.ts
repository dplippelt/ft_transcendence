import { apiRequest } from "./http";

// Matches ChatMessageCreate.content's max_length in the backend schema
// (services/backend/app/schemas/chat.py) -- kept in one place so the input
// and the validation it's enforcing client-side can't drift apart silently.
export const CHAT_MESSAGE_MAX_LENGTH = 2000;

export interface ChatMessageResponse
{
    id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    created_at: string;
    read_at: string | null;
}

export function getConversation(friendId: number, accessToken: string): Promise<ChatMessageResponse[]>
{
    return apiRequest<ChatMessageResponse[]>(`/chat/${friendId}/messages`, {}, accessToken);
}

export function sendChatMessage(friendId: number, content: string, accessToken: string): Promise<ChatMessageResponse>
{
    return apiRequest<ChatMessageResponse>(`/chat/${friendId}/messages`,
        {
            method: "POST",
            body: JSON.stringify({ content }),
        },
        accessToken,
    );
}

export function markConversationAsRead(friendId: number, accessToken: string): Promise<void>
{
    return apiRequest<void>(`/chat/${friendId}/read`,
        { method: "POST" },
        accessToken,
    );
}
