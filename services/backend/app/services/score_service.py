from sqlalchemy.orm import Session, joinedload

from app.db.utils import commit_or_bad_request
from app.models.score import Score
from app.models.user import User

MAX_SCORE_HISTORY = 100
TOP_N = 10


def record_score(db: Session, user_id: int, dungeon_id: int, value: int) -> Score:
    score = Score(
        user_id=user_id,
        dungeon_id=dungeon_id,
        value=value,
    )

    db.add(score)
    commit_or_bad_request(db, "Score could not be recorded")
    db.refresh(score)

    return score


def get_scores_for_user(db: Session, user_id: int) -> list[Score]:
    return (
        db.query(Score)
        .filter(Score.user_id == user_id)
        .order_by(Score.created_at.desc())
        .limit(MAX_SCORE_HISTORY)
        .all()
    )


def get_top_scores(db: Session, dungeon_id: int | None = None) -> list[Score]:
    query = (
        db.query(Score)
        .join(Score.user)
        .filter(User.is_active.is_(True))
        .options(joinedload(Score.user))
    )

    if dungeon_id is not None:
        query = query.filter(Score.dungeon_id == dungeon_id)

    return (
        query
        .order_by(Score.value.desc())
        .limit(TOP_N)
        .all()
    )
