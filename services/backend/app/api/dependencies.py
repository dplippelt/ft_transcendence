from typing import Annotated

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.exceptions import unauthorized, forbidden

from app.core.security import decode_access_token
from app.db.database import get_db
from app.models.user import User


DbSession = Annotated[Session, Depends(get_db)]

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")
BearerToken = Annotated[str, Depends(oauth2_scheme)]


def get_current_user(token: BearerToken, db: DbSession) -> User:
    payload = decode_access_token(token)

    if payload is None:
        raise unauthorized("Invalid authentication credentials",)

    user_id = payload.get("sub")

    try:
        user_id_int = int(user_id)
    except (TypeError, ValueError):
        raise unauthorized("Invalid authentication credentials",)

    user = (
        db.query(User)
        .filter(User.id == user_id_int)
        .first()
    )

    if user is None:
        raise unauthorized("Invalid authentication credentials",)

    if not user.is_active:
        raise forbidden("User account is inactive",)

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
