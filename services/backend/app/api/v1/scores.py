from fastapi import APIRouter, status

from app.api.dependencies import CurrentUser, DbSession
from app.core.exceptions import not_found
from app.models.dungeon import Dungeon
from app.models.score import Score
from app.schemas.score import ScoreCreate, ScoreResponse

router = APIRouter()


@router.post("", response_model=ScoreResponse, status_code=status.HTTP_201_CREATED)
def create_score(score_data: ScoreCreate, current_user: CurrentUser, db: DbSession):
    dungeon = (
        db.query(Dungeon)
        .filter(Dungeon.id == score_data.dungeon_id)
        .first()
    )

    if dungeon is None:
        raise not_found("Dungeon not found")

    score = Score(
        user_id=current_user.id,
        dungeon_id=score_data.dungeon_id,
        value=score_data.value,
    )

    db.add(score)
    db.commit()
    db.refresh(score)

    return score


@router.get("/{user_id}", response_model=list[ScoreResponse])
def get_scores(user_id: int, current_user: CurrentUser, db: DbSession):
    return (
        db.query(Score)
        .filter(Score.user_id == user_id)
        .order_by(Score.created_at.desc())
        .all()
    )
