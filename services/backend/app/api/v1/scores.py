from fastapi import APIRouter, status

from app.api.dependencies import CompletedUser, DbSession, SelfUser
from app.core.exceptions import ErrorCode, not_found
from app.schemas.score import ScoreCreate, ScoreResponse
from app.services.dungeon_service import get_dungeon_by_id
from app.services.score_service import get_scores_for_user, record_score

router = APIRouter()


@router.post("", response_model=ScoreResponse, status_code=status.HTTP_201_CREATED)
def create_score(score_data: ScoreCreate, current_user: CompletedUser, db: DbSession):
    dungeon = get_dungeon_by_id(db, score_data.dungeon_id)

    if dungeon is None:
        raise not_found("Dungeon not found", code=ErrorCode.DUNGEON_NOT_FOUND)

    return record_score(
        db=db,
        user_id=current_user.id,
        dungeon_id=score_data.dungeon_id,
        value=score_data.value,
    )


@router.get("/{user_id}", response_model=list[ScoreResponse])
def get_scores(self_user: SelfUser, db: DbSession):
    return get_scores_for_user(db, self_user.id)
