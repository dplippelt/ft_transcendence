from sqlalchemy.orm import Session

from app.core.exceptions import ErrorCode, bad_request
from app.db.utils import commit_or_bad_request
from app.models.auth_account import AuthAccount
from app.models.two_factor_recovery_code import (
    TwoFactorRecoveryCode,
)
from app.models.user import User
from app.schemas.user import UserUpdate
from app.services.avatar_service import delete_local_avatar


def get_active_user_by_id(db: Session, user_id: int) -> User | None:
    return (
        db.query(User)
        .filter(
            User.id == user_id,
            User.is_active.is_(True),
        )
        .first()
    )
    

def get_active_user_by_username(db: Session, username: str) -> User | None:
    return (
        db.query(User)
        .filter(
            User.username == username,
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
        raise bad_request("Username already exists", code=ErrorCode.USERNAME_ALREADY_EXISTS)


def update_user_profile(db: Session, user: User, data: UserUpdate) -> User:
    ensure_username_is_available(db, data.username, exclude_user_id=user.id)

    # exclude_unset (not exclude_none) so a field explicitly sent as null
    # clears it, while an omitted field is left untouched. mode="json" so
    # avatar_url (an HttpUrl object) is serialized to a plain str before
    # being assigned to the ORM's String column.
    for field, value in data.model_dump(exclude_unset=True, mode="json").items():
        setattr(user, field, value)

    commit_or_bad_request(db, "Username already exists", code=ErrorCode.USERNAME_ALREADY_EXISTS)

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
    user.avatar_url = None

    user.two_factor_enabled = False
    user.two_factor_secret = None

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

    # Delete two-factor recovery codes
    db.query(TwoFactorRecoveryCode).filter(
        TwoFactorRecoveryCode.user_id == user.id
    ).delete(synchronize_session=False)

    commit_or_bad_request(db, "Account could not be deactivated",)


def update_user_avatar(db: Session, user: User, avatar_url: str) -> User:
    old_avatar_url = user.avatar_url
    user.avatar_url = avatar_url

    commit_or_bad_request(db, "Avatar could not be updated",)

    delete_local_avatar(old_avatar_url)

    return user
