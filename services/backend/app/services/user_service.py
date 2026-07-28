from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import bad_request
from app.models.user import User
from app.schemas.user import UserUpdate


def get_active_user_by_id(db: Session, user_id: int) -> User | None:
    return (
        db.query(User)
        .filter(
            User.id == user_id,
            User.is_active.is_(True),
        )
        .first()
    )


def ensure_username_is_available(db: Session, username: str | None, exclude_user_id: int | None = None) -> None:
    if username is None:
        return

    query = db.query(User).filter(
        User.username == username,
        User.is_active.is_(True),
    )

    if exclude_user_id is not None:
        query = query.filter(User.id != exclude_user_id)

    if query.first():
        raise bad_request("Username already exists")


def update_user_profile(db: Session, user: User, data: UserUpdate) -> User:
    ensure_username_is_available(db, data.username, exclude_user_id=user.id)

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(user, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise bad_request("Username already exists")

    return user


def deactivate_user(db: Session, user: User) -> None:
    # Clear the username (not just is_active) so it's actually free for reuse:
    # the column has a DB-level unique constraint that doesn't know about
    # is_active, so a deactivated row would otherwise squat the name forever.
    user.is_active = False
    user.username = None

    db.commit()
