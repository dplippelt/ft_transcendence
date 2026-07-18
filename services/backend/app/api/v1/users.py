from fastapi import APIRouter

from app.api.dependencies import CurrentUser
from app.schemas.user import UserResponse


router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_me(current_user: CurrentUser):
    return current_user
