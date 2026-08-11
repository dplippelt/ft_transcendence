from fastapi import APIRouter

from app.api.dependencies import CompletedUser, DbSession
from app.core.exceptions import ErrorCode, not_found
from app.schemas.score import LeaderboardEntryResponse
from app.services.dungeon_service import get_dungeon_by_id
from app.services.score_service import get_top_scores

router = APIRouter()


@router.get("", response_model=list[LeaderboardEntryResponse])
def get_leaderboard(current_user: CompletedUser, db: DbSession):
    return get_top_scores(db)


@router.get("/{dungeon_id}", response_model=list[LeaderboardEntryResponse])
def get_dungeon_leaderboard(dungeon_id: int, current_user: CompletedUser, db: DbSession):
    dungeon = get_dungeon_by_id(db, dungeon_id)

    if dungeon is None:
        raise not_found("Dungeon not found", code=ErrorCode.DUNGEON_NOT_FOUND)

    return get_top_scores(db, dungeon_id=dungeon_id)
