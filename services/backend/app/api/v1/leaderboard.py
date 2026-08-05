from fastapi import APIRouter
from sqlalchemy.orm import joinedload

from app.api.dependencies import CurrentUser, DbSession
from app.core.exceptions import not_found
from app.models.dungeon import Dungeon
from app.models.score import Score
from app.schemas.score import LeaderboardEntryResponse

router = APIRouter()

TOP_N = 10


@router.get("", response_model=list[LeaderboardEntryResponse])
def get_leaderboard(current_user: CurrentUser, db: DbSession):
    return (
        db.query(Score)
        .options(joinedload(Score.user))
        .order_by(Score.value.desc())
        .limit(TOP_N)
        .all()
    )


@router.get("/{dungeon_id}", response_model=list[LeaderboardEntryResponse])
def get_dungeon_leaderboard(dungeon_id: int, current_user: CurrentUser, db: DbSession):
    dungeon = (
        db.query(Dungeon)
        .filter(Dungeon.id == dungeon_id)
        .first()
    )

    if dungeon is None:
        raise not_found("Dungeon not found")

    return (
        db.query(Score)
        .options(joinedload(Score.user))
        .filter(Score.dungeon_id == dungeon_id)
        .order_by(Score.value.desc())
        .limit(TOP_N)
        .all()
    )
