from fastapi import APIRouter, status
from sqlalchemy.orm import Session

from app.api.dependencies import CurrentUser, DbSession
from app.core.exceptions import bad_request, forbidden, not_found
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate


router = APIRouter()


def get_active_user_by_id(db: Session, user_id: int) -> User | None:
    return (
        db.query(User)
        .filter(
            User.id == user_id,
            User.is_active.is_(True),
        )
        .first()
    )


def ensure_username_is_available(db: Session, username: str | None, exclude_user_id: int) -> None:
    if username is None:
        return

    existing_user = (
        db.query(User)
        .filter(
            User.username == username,
            User.id != exclude_user_id,
        )
        .first()
    )

    if existing_user:
        raise bad_request("Username already exists")


@router.get("/me", response_model=UserResponse)
def get_me(current_user: CurrentUser):
    return current_user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, current_user: CurrentUser, db: DbSession):
    user = get_active_user_by_id(db, user_id)

    if user is None:
        raise not_found("User not found")

    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_data: UserUpdate, current_user: CurrentUser, db: DbSession):
    if user_id != current_user.id:
        raise forbidden("You can only update your own account")

    ensure_username_is_available(db, user_data.username, exclude_user_id=current_user.id)

    if user_data.username is not None:
        current_user.username = user_data.username

    if user_data.display_name is not None:
        current_user.display_name = user_data.display_name

    if user_data.avatar_url is not None:
        current_user.avatar_url = user_data.avatar_url

    db.commit()
    db.refresh(current_user)

    return current_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, current_user: CurrentUser, db: DbSession):
    if user_id != current_user.id:
        raise forbidden("You can only delete your own account")

    current_user.is_active = False
    db.commit()

    return None
