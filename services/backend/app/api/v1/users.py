from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Request, UploadFile, status

from app.api.dependencies import CompletedUser, CurrentUser, DbSession, SelfUser
from app.core.exceptions import bad_request, not_found
from app.schemas.user import PublicUserResponse, UserResponse, UserUpdate
from app.services.user_service import (
    deactivate_user,
    get_active_user_by_id,
    update_user_avatar,
    update_user_profile,
)
from app.services.avatar_service import delete_local_avatar


router = APIRouter()

AVATAR_DIR = Path("uploads/avatars")

ALLOWED_AVATAR_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

MAX_AVATAR_SIZE = 2 * 1024 * 1024

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
    avatar_url = self_user.avatar_url
    
    deactivate_user(db, self_user)
    
    delete_local_avatar(avatar_url)

    return None


@router.put("/{user_id}/avatar", response_model=UserResponse)
async def update_avatar(request: Request, self_user: SelfUser, db: DbSession, avatar: UploadFile = File(...),):
    extension = ALLOWED_AVATAR_TYPES.get(avatar.content_type)

    if extension is None:
        raise bad_request("Avatar must be a JPEG, PNG, or WebP image")

    contents = await avatar.read(MAX_AVATAR_SIZE + 1)

    if len(contents) > MAX_AVATAR_SIZE:
        raise bad_request("Avatar must be less than 2MB in size")

    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{extension}"
    avatar_path = AVATAR_DIR / filename

    avatar_path.write_bytes(contents)
    avatar_url = str(request.url_for("avatars", path=filename,))

    return update_user_avatar(db, self_user, avatar_url,)
