from typing import Annotated

from fastapi import Depends, Query, WebSocket, WebSocketException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.exceptions import forbidden, unauthorized
from app.core.security import decode_access_token
from app.db.database import SessionLocal, get_db
from app.models.user import User


DbSession = Annotated[Session, Depends(get_db)]

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")
BearerToken = Annotated[str, Depends(oauth2_scheme)]


def get_user_from_token(token: str | None, db: Session) -> User | None:
    if token is None:
        return None

    payload = decode_access_token(token)

    if payload is None:
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
        raise unauthorized("Invalid authentication credentials",)

    if not user.is_active:
        raise forbidden("User account is inactive",)

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_current_user_id_ws(
    websocket: WebSocket,
    # Browsers can't set custom headers on the WS handshake, so the token
    # travels in the query string instead. That risks exposure via
    # reverse-proxy/access logs that record full request URLs -- deployments
    # should keep this behind WSS and avoid logging query strings for this
    # path, and access tokens should stay short-lived.
    token: str | None = Query(default=None),
) -> int:
    # Deliberately not the DbSession dependency: that session stays open for
    # as long as the WebSocket connection does (get_db only closes it when
    # the endpoint returns), which for a long-lived connection means an idle
    # session/transaction held for hours just to check the token once at
    # connect time. Use a short-lived session instead, scoped to this check.
    #
    # Returns just the id rather than the User: the object would be detached
    # once this session closes, and the id is all the WS layer needs -- this
    # keeps future code from being tempted to lazy-load a relationship off
    # a detached instance.
    db = SessionLocal()

    try:
        user = get_user_from_token(token, db)
    finally:
        db.close()

    if user is None or not user.is_active:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)

    return user.id


CurrentUserIdWS = Annotated[int, Depends(get_current_user_id_ws)]
