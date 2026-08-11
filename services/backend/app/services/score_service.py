from sqlalchemy.orm import Session, contains_eager

from app.db.utils import commit_or_bad_request
from app.models.score import Score
from app.models.user import User

MAX_SCORE_HISTORY = 100
TOP_N = 10

# Upper bound on raw rows considered before deduping to one entry per user.
# Comfortably larger than TOP_N so the top TOP_N distinct users are never cut
# off by the cap in practice, without an unbounded scan of the scores table.
RAW_CANDIDATE_LIMIT = 500


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
        .options(contains_eager(Score.user))
    )

    if dungeon_id is not None:
        query = query.filter(Score.dungeon_id == dungeon_id)

    ranked_scores = (
        query
        .order_by(Score.value.desc())
        .limit(RAW_CANDIDATE_LIMIT)
        .all()
    )

    # Keep only each user's best score so one player can't occupy multiple
    # leaderboard slots; ranked_scores is already sorted by value desc, so
    # the first row seen per user is their best.
    best_per_user: dict[int, Score] = {}
    for score in ranked_scores:
        best_per_user.setdefault(score.user_id, score)

    return list(best_per_user.values())[:TOP_N]
