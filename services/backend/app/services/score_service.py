from sqlalchemy import func
from sqlalchemy.orm import Session, contains_eager

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
        # id as a tiebreaker: created_at alone isn't guaranteed unique, so
        # ordering would otherwise be nondeterministic between scores
        # submitted in the same instant.
        .order_by(Score.created_at.desc(), Score.id.desc())
        .limit(MAX_SCORE_HISTORY)
        .all()
    )


def get_top_scores(db: Session, dungeon_id: int | None = None) -> list[Score]:
    # Each user's best (highest) value, scoped to dungeon_id if given.
    best_value_subq = db.query(
        Score.user_id.label("user_id"),
        func.max(Score.value).label("best_value"),
    )
    if dungeon_id is not None:
        best_value_subq = best_value_subq.filter(Score.dungeon_id == dungeon_id)
    best_value_subq = best_value_subq.group_by(Score.user_id).subquery()

    # The earliest Score row that actually reached each user's best value --
    # id is a deterministic tiebreaker for a user who hit that value more
    # than once (or, for the global leaderboard, in more than one dungeon).
    best_score_id_subq = (
        db.query(func.min(Score.id).label("id"))
        .join(
            best_value_subq,
            (Score.user_id == best_value_subq.c.user_id)
            & (Score.value == best_value_subq.c.best_value),
        )
    )
    if dungeon_id is not None:
        best_score_id_subq = best_score_id_subq.filter(Score.dungeon_id == dungeon_id)
    best_score_id_subq = best_score_id_subq.group_by(Score.user_id).subquery()

    # Deduping happens above, over the whole table, before this limit -- so
    # the result always contains up to TOP_N distinct users whenever that
    # many exist, regardless of how many rows any single user has.
    return (
        db.query(Score)
        .join(best_score_id_subq, Score.id == best_score_id_subq.c.id)
        .join(Score.user)
        .filter(User.is_active.is_(True))
        .options(contains_eager(Score.user))
        .order_by(Score.value.desc(), Score.id.asc())
        .limit(TOP_N)
        .all()
    )
