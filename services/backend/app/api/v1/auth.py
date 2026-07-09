from typing import Annotated

import cachecontrol
import requests
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import (
    DUMMY_PASSWORD_HASH,
    create_access_token,
    get_password_hash,
    verify_password,
)
from app.core.settings import get_settings
from app.db.database import get_db
from app.models.auth_account import AuthAccount
from app.models.user import User
from app.schemas.user import GoogleLogin, Token, UserLogin, UserRegister, UserResponse


router = APIRouter()
settings = get_settings()
DbSession = Annotated[Session, Depends(get_db)]
OAuth2Form = Annotated[OAuth2PasswordRequestForm, Depends()]

GOOGLE_PROVIDER = "google"
PASSWORD_PROVIDER = "password"

google_session = cachecontrol.CacheControl(requests.Session())
google_request = google_requests.Request(session=google_session)


def normalize_email(email: str) -> str:
    return email.strip().lower()


def create_token_for_user(user: User) -> Token:
    access_token = create_access_token(data={"sub": str(user.id)})

    return Token(
        access_token=access_token,
        token_type="bearer",
    )


def get_password_account_by_email(db: Session, email: str) -> AuthAccount | None:
    return (
        db.query(AuthAccount)
        .filter(
            AuthAccount.provider == PASSWORD_PROVIDER,
            AuthAccount.provider_account_id == email,
        )
        .first()
    )


def get_google_account_by_sub(db: Session, google_sub: str) -> AuthAccount | None:
    return (
        db.query(AuthAccount)
        .filter(
            AuthAccount.provider == GOOGLE_PROVIDER,
            AuthAccount.provider_account_id == google_sub,
        )
        .first()
    )


def ensure_username_is_available(db: Session, username: str | None) -> None:
    if username is None:
        return

    existing_user = (
        db.query(User)
        .filter(User.username == username)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )


def authenticate_password_user(db: Session, email: str, password: str) -> User:
    email = normalize_email(email)

    auth_account = get_password_account_by_email(db, email)

    password_hash = (
        auth_account.password_hash
        if auth_account and auth_account.password_hash
        else DUMMY_PASSWORD_HASH
    )

    is_valid_password = verify_password(password, password_hash)

    if not auth_account or not is_valid_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = auth_account.user

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user


@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserRegister, db: DbSession):
    email = normalize_email(user_data.email)

    existing_auth_account = get_password_account_by_email(db, email)

    if existing_auth_account:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists",
        )

    ensure_username_is_available(db, user_data.username)

    user = User(
        username=user_data.username,
        display_name=user_data.username,
        is_guest=False,
    )

    auth_account = AuthAccount(
        user=user,
        provider=PASSWORD_PROVIDER,
        provider_account_id=email,
        email=email,
        email_verified=False,
        password_hash=get_password_hash(user_data.password),
    )

    db.add(user)
    db.add(auth_account)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User could not be registered",
        )

    db.refresh(user)

    return user


@router.post("/login", response_model=Token)
def login_user(user_data: UserLogin, db: DbSession):
    user = authenticate_password_user(
        db,
        user_data.email,
        user_data.password,
    )

    return create_token_for_user(user)


@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2Form, db: DbSession):
    user = authenticate_password_user(
        db,
        form_data.username,
        form_data.password,
    )

    return create_token_for_user(user)


@router.post("/google", response_model=Token)
def google_login(user_data: GoogleLogin, db: DbSession):
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google login is not configured",
        )

    try:
        google_user = id_token.verify_oauth2_token(
            user_data.credential,
            google_request,
            settings.google_client_id,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credentials",
        )

    google_sub = google_user.get("sub")
    email = google_user.get("email")
    email_verified = google_user.get("email_verified", False)
    display_name = google_user.get("name")
    avatar_url = google_user.get("picture")

    if not google_sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google account has no subject identifier",
        )

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google account has no email",
        )

    if not email_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google email is not verified",
        )

    email = normalize_email(email)

    google_auth_account = get_google_account_by_sub(db, google_sub)

    if google_auth_account:
        user = google_auth_account.user

        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )

        return create_token_for_user(user)

    password_auth_account = get_password_account_by_email(db, email)

    if password_auth_account:
        user = password_auth_account.user

        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )

        google_auth_account = AuthAccount(
            user=user,
            provider=GOOGLE_PROVIDER,
            provider_account_id=google_sub,
            email=email,
            email_verified=True,
            password_hash=None,
        )

        if not user.display_name and display_name:
            user.display_name = display_name

        if not user.avatar_url and avatar_url:
            user.avatar_url = avatar_url

        db.add(google_auth_account)

        try:
            db.commit()
        except IntegrityError:
            db.rollback()

            existing_google_auth_account = get_google_account_by_sub(db, google_sub)

            if (
                existing_google_auth_account
                and existing_google_auth_account.user
                and existing_google_auth_account.user.is_active
            ):
                return create_token_for_user(existing_google_auth_account.user)

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google account could not be linked",
            )

        db.refresh(user)

        return create_token_for_user(user)

    user = User(
        username=None,
        display_name=display_name,
        avatar_url=avatar_url,
        is_guest=False,
    )

    google_auth_account = AuthAccount(
        user=user,
        provider=GOOGLE_PROVIDER,
        provider_account_id=google_sub,
        email=email,
        email_verified=True,
        password_hash=None,
    )

    db.add(user)
    db.add(google_auth_account)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        existing_google_auth_account = get_google_account_by_sub(db, google_sub)

        if (
            existing_google_auth_account
            and existing_google_auth_account.user
            and existing_google_auth_account.user.is_active
        ):
            return create_token_for_user(existing_google_auth_account.user)

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account could not be registered",
        )

    db.refresh(user)

    return create_token_for_user(user)
