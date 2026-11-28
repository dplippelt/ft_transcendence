import { apiRequest } from "./http";
import type { PublicUser } from "./friendsApi";

export function getUserProfile(userID: number, accessToken: string): Promise<PublicUser>
{
    return apiRequest<PublicUser>(`/users/${userID}`, {}, accessToken);
}
