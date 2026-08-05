from fastapi import APIRouter

from app.api.dependencies import CurrentUser, DbSession
from app.core.exceptions import not_found
from app.models.dungeon import Dungeon
from app.schemas.dungeon import DungeonResponse

router = APIRouter()


@router.get("", response_model=list[DungeonResponse])
def get_dungeons(current_user: CurrentUser, db: DbSession):
    return (
        db.query(Dungeon)
        .order_by(Dungeon.id)
        .all()
    )


@router.get("/{dungeon_id}", response_model=DungeonResponse)
def get_dungeon(dungeon_id: int, current_user: CurrentUser, db: DbSession):
    dungeon = (
        db.query(Dungeon)
        .filter(Dungeon.id == dungeon_id)
        .first()
    )

    if dungeon is None:
        raise not_found("Dungeon not found")

    return dungeon
