from datetime import timedelta

from fastapi import APIRouter, status

from app.api.dependencies import CompletedUser, DbSession, SelfUser
from app.core.exceptions import ErrorCode, not_found, too_many_requests
from app.core.rate_limit import FixedWindowLimiter
from app.schemas.score import ScoreCreate, ScoreResponse
from app.services.dungeon_service import get_dungeon_by_id
from app.services.score_service import get_scores_for_user, record_score

router = APIRouter()

# Keyed by user id: this only guards against a single account flooding the
# leaderboard with submissions, not against a single implausible value (the
# server has no way to verify a submitted score was actually earned, since
# gameplay runs entirely client-side). A real dungeon run takes well over a
# few seconds, so this window is generous for legitimate play while still
# capping automated flooding.
SCORE_RATE_LIMIT_WINDOW = timedelta(minutes=1)
SCORE_RATE_LIMIT_MAX = 10
_score_rate_limiter = FixedWindowLimiter(SCORE_RATE_LIMIT_WINDOW, SCORE_RATE_LIMIT_MAX)


def _check_score_rate_limit(user_id: int) -> None:
    if not _score_rate_limiter.allow(user_id):
        raise too_many_requests(
            "Too many score submissions. Try again shortly.",
            code=ErrorCode.SCORE_RATE_LIMIT_EXCEEDED,
        )


@router.post("", response_model=ScoreResponse, status_code=status.HTTP_201_CREATED)
def create_score(score_data: ScoreCreate, current_user: CompletedUser, db: DbSession):
    _check_score_rate_limit(current_user.id)

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
def get_scores(self_user: SelfUser, _completed: CompletedUser, db: DbSession):
    return get_scores_for_user(db, self_user.id)
