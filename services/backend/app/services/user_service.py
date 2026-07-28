from sqlalchemy.orm import Session

from app.core.exceptions import bad_request
from app.models.auth_account import AuthAccount
from app.models.user import User
from app.schemas.user import UserUpdate
from app.services.friend_service import commit_or_bad_request


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

    # is_active is redundant today since deactivate_user always renames a
    # user's username away in the same transaction it flips is_active, but
    # it's kept as a defensive backstop in case some future code path (e.g.
    # an admin/ban tool) ever deactivates a user without renaming them.
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

    # exclude_unset (not exclude_none) so a field explicitly sent as null
    # clears it, while an omitted field is left untouched.
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    commit_or_bad_request(db, "Username already exists")

    return user


def _renamed_for_deactivation(value: str, user_id: int, max_length: int) -> str:
    # Rename (rather than null out) so the value is freed for reuse without
    # losing the fact that this row used to hold it -- the DB's unique
    # constraints on username/provider_account_id don't know about is_active,
    # so a deactivated row would otherwise squat the value forever.
    suffix = f"_deleted_{user_id}"
    truncated_length = max(0, max_length - len(suffix))

    return value[:truncated_length] + suffix


def deactivate_user(db: Session, user: User) -> None:
    user.is_active = False

    if user.username is not None:
        user.username = _renamed_for_deactivation(
            user.username, user.id, User.__table__.c.username.type.length
        )

    for auth_account in user.auth_accounts:
        auth_account.provider_account_id = _renamed_for_deactivation(
            auth_account.provider_account_id,
            user.id,
            AuthAccount.__table__.c.provider_account_id.type.length,
        )

        if auth_account.email is not None:
            auth_account.email = _renamed_for_deactivation(
                auth_account.email, user.id, AuthAccount.__table__.c.email.type.length
            )

    commit_or_bad_request(db, "Account could not be deactivated")
