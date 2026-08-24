from fastapi import APIRouter, status

from app.api.dependencies import CompletedUser, CurrentUser, DbSession, SelfUser
from app.core.exceptions import not_found
from app.schemas.user import PublicUserResponse, UserResponse, UserUpdate
from app.services.user_service import (
    deactivate_user,
    get_active_user_by_id,
    update_user_profile,
)

    
router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_me(current_user: CurrentUser):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_me(user_update: UserUpdate, current_user: CurrentUser, db: DbSession,):
    return update_user_profile(db, current_user, user_update)


@router.get("/{user_id}", response_model=PublicUserResponse)
def get_user(user_id: int, _current_user: CompletedUser, db: DbSession):
    user = get_active_user_by_id(db, user_id)

    if user is None:
        raise not_found("User not found")

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(self_user: SelfUser, db: DbSession):
    deactivate_user(db, self_user)

    return None
