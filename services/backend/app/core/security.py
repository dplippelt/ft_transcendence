from datetime import datetime, timedelta, timezone

import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from pwdlib import PasswordHash

from app.core.settings import get_settings


settings = get_settings()
password_hash = PasswordHash.recommended()

DUMMY_PASSWORD_HASH = password_hash.hash("")
TWO_FACTOR_CHALLENGE_EXPIRE_MINUTES = 5


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return password_hash.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode.update({
        "exp": expire,
        "purpose": "access",
    })

    return jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm,
    )


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
    except (ExpiredSignatureError, InvalidTokenError):
        return None


def create_two_factor_challenge_token(user_id: int,) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=TWO_FACTOR_CHALLENGE_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "purpose": "two_factor",
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.secret_key,
        algorithm=settings.algorithm,
    )


def decode_two_factor_challenge(token: str,) -> int | None:
    payload = decode_token(token)

    if payload is None:
        return None

    if payload.get("purpose") != "two_factor":
        return None

    user_id = payload.get("sub")

    try:
        return int(user_id)
    except (TypeError, ValueError):
        return None
