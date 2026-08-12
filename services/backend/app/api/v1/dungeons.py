from fastapi import APIRouter

from app.api.dependencies import CompletedUser, DbSession
from app.core.exceptions import ErrorCode, not_found
from app.schemas.dungeon import DungeonResponse
from app.services.dungeon_service import get_dungeon_by_id, list_dungeons

router = APIRouter()


@router.get("", response_model=list[DungeonResponse])
def get_dungeons(current_user: CompletedUser, db: DbSession):
    return list_dungeons(db)


@router.get("/{dungeon_id}", response_model=DungeonResponse)
def get_dungeon(dungeon_id: int, current_user: CompletedUser, db: DbSession):
    dungeon = get_dungeon_by_id(db, dungeon_id)

    if dungeon is None:
        raise not_found("Dungeon not found", code=ErrorCode.DUNGEON_NOT_FOUND)

    return dungeon
