from typing import Annotated

from fastapi import Depends, Query, WebSocket, WebSocketException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.exceptions import ErrorCode, forbidden, unauthorized
from app.core.security import decode_token
from app.core.settings import get_settings
from app.db.database import SessionLocal, get_db
from app.models.user import User
from app.services.websocket_ticket_service import consume_websocket_ticket

DbSession = Annotated[Session, Depends(get_db)]

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")
BearerToken = Annotated[str, Depends(oauth2_scheme)]


def get_user_from_token(token: str | None, db: Session) -> User | None:
    if token is None:
        return None

    payload = decode_token(token)

    if payload is None:
        return None

    if payload.get("purpose") != "access":
        return None

    user_id = payload.get("sub")

    try:
        user_id_int = int(user_id)
    except (TypeError, ValueError):
        return None

    return (
        db.query(User)
        .filter(User.id == user_id_int)
        .first()
    )


def get_current_user(token: BearerToken, db: DbSession) -> User:
    user = get_user_from_token(token, db)

    if user is None:
        raise unauthorized("Invalid authentication credentials", code=ErrorCode.INVALID_TOKEN)

    if not user.is_active:
        raise forbidden("User account is inactive", code=ErrorCode.ACCOUNT_INACTIVE)

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_completed_user(current_user: CurrentUser,) -> User:
    if current_user.username is None:
        raise forbidden(
            "Choose a username before using this feature",
            code=ErrorCode.USERNAME_REQUIRED,
        )

    return current_user


CompletedUser = Annotated[User, Depends(get_completed_user),]


def get_current_user_matching_path(user_id: int, current_user: CurrentUser) -> User:
    if user_id != current_user.id:
        raise forbidden("You can only modify your own account", code=ErrorCode.NOT_SELF_ACCOUNT)

    return current_user


SelfUser = Annotated[User, Depends(get_current_user_matching_path)]


def get_current_user_id_ws(websocket: WebSocket, ticket: str | None = Query(default=None),) -> int:
    # Browser WebSocket handshakes are not covered by CORS middleware.
    # Require a single-use ticket from our configured frontend origin.
    if not ticket or websocket.headers.get("origin") != get_settings().frontend_origin:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)

    # Keep the database session scoped to handshake authentication, not the
    # entire WebSocket lifetime.
    db = SessionLocal()
    try:
        user_id = consume_websocket_ticket(db, ticket)
        user = db.get(User, user_id) if user_id is not None else None

        if user is None or not user.is_active or user.username is None:
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)

        return user.id
    finally:
        db.close()


CurrentUserIdWS = Annotated[int, Depends(get_current_user_id_ws)]
