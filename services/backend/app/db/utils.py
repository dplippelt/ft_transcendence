from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ErrorCode, bad_request


def commit_or_bad_request(db: Session, detail: str, code: ErrorCode | None = None) -> None:
    # Used for writes that may hit DB uniqueness constraints.
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise bad_request(detail, code=code)
