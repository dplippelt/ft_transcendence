import { apiRequest } from "./http";
import type { PublicUser } from "./friendsApi";

export interface DungeonResponse
{
    id: number;
    name: string;
    description: string | null;
    difficulty: number;
}

export interface LeaderboardEntryResponse
{
    user: PublicUser;
    dungeon_id: number;
    value: number;
    created_at: string;
}

export function getDungeons(accessToken: string): Promise<DungeonResponse[]>
{
    return apiRequest<DungeonResponse[]>("/dungeons", {}, accessToken);
}

export function getDungeonLeaderboard(dungeonId: number, accessToken: string): Promise<LeaderboardEntryResponse[]>
{
    return apiRequest<LeaderboardEntryResponse[]>(`/leaderboard/${dungeonId}`, {}, accessToken);
}
