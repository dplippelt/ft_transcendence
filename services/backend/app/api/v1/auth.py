from dataclasses import dataclass
from typing import Annotated

import cachecontrol
import requests
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from google.auth import exceptions as google_auth_exceptions
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.dependencies import CurrentUser, DbSession
from app.core.exceptions import (
    ErrorCode,
    bad_request,
    conflict,
    forbidden,
    service_unavailable,
    unauthorized,
)
from app.core.security import (
    DUMMY_PASSWORD_HASH,
    create_access_token,
    get_password_hash,
    verify_password,
)
from app.core.settings import get_settings
from app.models.auth_account import AuthAccount
from app.models.user import User
from app.schemas.user import (
    GoogleLogin,
    Token,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.services.user_service import ensure_username_is_available


router = APIRouter()
settings = get_settings()
OAuth2Form = Annotated[OAuth2PasswordRequestForm, Depends()]

GOOGLE_PROVIDER = "google"
PASSWORD_PROVIDER = "password"

google_session = cachecontrol.CacheControl(requests.Session())
google_request = google_requests.Request(session=google_session)


@dataclass(frozen=True)
class GoogleIdentity:
    sub: str
    email: str
    display_name: str | None
    avatar_url: str | None


def normalize_email(email: str) -> str:
    return email.strip().lower()


def create_token_for_user(user: User) -> Token:
    access_token = create_access_token(data={"sub": str(user.id)})

    return Token(
        access_token=access_token,
        token_type="bearer",
    )


def get_auth_account_by_email(db: Session, email: str) -> AuthAccount | None:
    return (
        db.query(AuthAccount)
        .filter(AuthAccount.email == email)
        .first()
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


def get_google_account_for_user(db: Session, user_id: int) -> AuthAccount | None:
    return (
        db.query(AuthAccount)
        .filter(
            AuthAccount.provider == GOOGLE_PROVIDER,
            AuthAccount.user_id == user_id,
        )
        .first()
    )


def find_existing_google_link(db: Session, google_sub: str, current_user: User,) -> AuthAccount | None:
    existing_google_account = get_google_account_by_sub(db, google_sub,)

    if existing_google_account:
        if existing_google_account.user_id == current_user.id:
            return existing_google_account

        raise conflict(
            "This Google account is already linked to another user",
            code=ErrorCode.GOOGLE_ACCOUNT_ALREADY_LINKED,
        )

    current_google_account = get_google_account_for_user(db, current_user.id,)

    if current_google_account:
        raise conflict(
            "A Google account is already linked to this user",
            code=ErrorCode.GOOGLE_PROVIDER_ALREADY_LINKED,
        )

    return None


def verify_google_credential(credential: str,) -> GoogleIdentity:
    if not settings.google_client_id:
        raise service_unavailable(
            "Google login is not configured",
            code=ErrorCode.GOOGLE_NOT_CONFIGURED,
        )

    try:
        google_user = id_token.verify_oauth2_token(
            credential,
            google_request,
            settings.google_client_id,
        )
    except (ValueError, google_auth_exceptions.GoogleAuthError):
        raise unauthorized(
            "Invalid Google credentials",
            code=ErrorCode.INVALID_GOOGLE_CREDENTIALS,
        )

    google_sub = google_user.get("sub")
    email = google_user.get("email")
    email_verified = google_user.get("email_verified", False)
    display_name = google_user.get("name")
    avatar_url = google_user.get("picture")

    if not isinstance(google_sub, str) or not google_sub:
        raise unauthorized(
            "Google account has no subject identifier",
            code=ErrorCode.GOOGLE_SUBJECT_MISSING,
        )

    if not isinstance(email, str) or not email:
        raise unauthorized(
            "Google account has no email",
            code=ErrorCode.GOOGLE_EMAIL_MISSING,
        )

    if email_verified is not True:
        raise unauthorized(
            "Google email is not verified",
            code=ErrorCode.GOOGLE_EMAIL_NOT_VERIFIED,
        )

    return GoogleIdentity(
        sub = google_sub,
        email = normalize_email(email),
        display_name = (
            display_name
            if isinstance(display_name, str)
            else None
        ),
        avatar_url = (
            avatar_url
            if isinstance(avatar_url, str)
            else None
        ),
    )


def get_active_user_from_auth_account(auth_account: AuthAccount) -> User:
    user = auth_account.user

    if not user or not user.is_active:
        raise forbidden(
            "User account is inactive",
            code=ErrorCode.ACCOUNT_INACTIVE,
        )
    return user


def apply_google_profile_defaults(user: User, identity: GoogleIdentity) -> bool:
    changed = False

    if not user.display_name and identity.display_name:
        user.display_name = identity.display_name
        changed = True

    if not user.avatar_url and identity.avatar_url:
        user.avatar_url = identity.avatar_url
        changed = True

    return changed


def create_google_auth_account(user: User, identity: GoogleIdentity,) -> AuthAccount:
    return AuthAccount(
        user=user,
        provider=GOOGLE_PROVIDER,
        provider_account_id=identity.sub,
        email=identity.email,
        email_verified=True,
        password_hash=None,
    )


def authenticate_password_user(db: Session, email: str, password: str) -> User:
    email = normalize_email(email)
    auth_account = get_password_account_by_email(db, email,)
    password_hash = (
        auth_account.password_hash
        if auth_account and auth_account.password_hash
        else DUMMY_PASSWORD_HASH
    )
    is_valid_password = verify_password(password, password_hash)

    if not auth_account or not is_valid_password:
<<<<<<< HEAD
        raise unauthorized(
            "Invalid email or password",
            code=ErrorCode.INVALID_CREDENTIALS,
        )

    return get_active_user_from_auth_account(auth_account)
=======
        raise unauthorized("Invalid email or password", code=ErrorCode.INVALID_CREDENTIALS)

    user = auth_account.user

    if not user or not user.is_active:
        raise forbidden("User account is inactive", code=ErrorCode.ACCOUNT_INACTIVE)

    return user
>>>>>>> master


@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserRegister, db: DbSession):
    email = normalize_email(user_data.email)

    existing_auth_account = get_auth_account_by_email(db, email)

    if existing_auth_account:
<<<<<<< HEAD
        raise bad_request(
            "Email already exists",
            code=ErrorCode.EMAIL_ALREADY_EXISTS,
        )
=======
        raise bad_request("Email already exists", code=ErrorCode.EMAIL_ALREADY_EXISTS)
>>>>>>> master

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
        raise bad_request("User could not be registered", code=ErrorCode.REGISTRATION_FAILED)

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
<<<<<<< HEAD
    identity = verify_google_credential(user_data.credential,)
    google_auth_account = get_google_account_by_sub(db, identity.sub)
=======
    if not settings.google_client_id:
        raise service_unavailable("Google login is not configured", code=ErrorCode.GOOGLE_NOT_CONFIGURED)

    try:
        # Verifies the token signature, audience, expiry, and Google issuer.
        google_user = id_token.verify_oauth2_token(
            user_data.credential,
            google_request,
            settings.google_client_id,
        )
    except (ValueError, google_auth_exceptions.GoogleAuthError):
        raise unauthorized("Invalid Google credentials", code=ErrorCode.INVALID_GOOGLE_CREDENTIALS  )

    google_sub = google_user.get("sub")
    email = google_user.get("email")
    email_verified = google_user.get("email_verified", False)
    display_name = google_user.get("name")
    avatar_url = google_user.get("picture")

    if not google_sub:
        raise unauthorized("Google account has no subject identifier", code=ErrorCode.GOOGLE_SUBJECT_MISSING)

    if not email:
        raise unauthorized("Google account has no email", code=ErrorCode.GOOGLE_EMAIL_MISSING)

    if not email_verified:
        raise unauthorized("Google email is not verified", code=ErrorCode.GOOGLE_EMAIL_NOT_VERIFIED)

    email = normalize_email(email)

    google_auth_account = get_google_account_by_sub(db, google_sub)
>>>>>>> master

    if google_auth_account:
        user = get_active_user_from_auth_account(google_auth_account,)

<<<<<<< HEAD
        if apply_google_profile_defaults(user, identity):
            try:
                db.commit()
            except SQLAlchemyError:
                db.rollback()
            else:
                db.refresh(user)
=======
        if not user or not user.is_active:
            raise forbidden("User account is inactive", code=ErrorCode.ACCOUNT_INACTIVE)
>>>>>>> master

        return create_token_for_user(user)

    existing_email_account = get_auth_account_by_email(db, identity.email)

<<<<<<< HEAD
    if existing_email_account:
        raise conflict(
            (
                "An account with this email already exists. "
                "Sign in to that account and link Google "
                "from your account settings."
            ),
            code=ErrorCode.GOOGLE_ACCOUNT_NOT_LINKED,
        )

=======
    if password_auth_account:
        user = password_auth_account.user

        if not user or not user.is_active:
            raise forbidden("User account is inactive", code=ErrorCode.ACCOUNT_INACTIVE)

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

            raise bad_request("Google account could not be linked", code=ErrorCode.GOOGLE_LINK_FAILED)

        db.refresh(user)

        return create_token_for_user(user)

>>>>>>> master
    user = User(
        username=None,
        display_name=identity.display_name,
        avatar_url=identity.avatar_url,
        is_guest=False,
    )

    google_auth_account = create_google_auth_account(user, identity,)
    
    db.add(user)
    db.add(google_auth_account)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        existing_google_account = (get_google_account_by_sub(db, identity.sub,))

        if existing_google_account:
            user = get_active_user_from_auth_account(
                existing_google_account,
            )
            return create_token_for_user(user)

<<<<<<< HEAD
        existing_email_account = (get_auth_account_by_email(db, identity.email,))

        if existing_email_account:
            raise conflict(
                (
                    "An account with this email already "
                    "exists. Sign in and link Google from "
                    "your account settings."
                ),
                code=ErrorCode.GOOGLE_ACCOUNT_NOT_LINKED,
            )

        raise bad_request(
            "Google account could not be registered",
            code=ErrorCode.GOOGLE_REGISTRATION_FAILED,
        )
=======
        raise bad_request("Google account could not be registered", code=ErrorCode.GOOGLE_REGISTRATION_FAILED)
>>>>>>> master

    db.refresh(user)

    return create_token_for_user(user)

@router.post("/google/link", response_model=UserResponse)
def link_google_account(user_data: GoogleLogin,db: DbSession, current_user: CurrentUser):
    identity = verify_google_credential(user_data.credential)
    existing_link = find_existing_google_link(db, identity.sub, current_user)

    if existing_link:
        if apply_google_profile_defaults(
            current_user,
            identity,
        ):
            try:
                db.commit()
            except SQLAlchemyError:
                db.rollback()
                raise bad_request(
                    "Google profile could not be synchronized",
                    code=ErrorCode.GOOGLE_LINK_FAILED,
                )

            db.refresh(current_user)

        return current_user

    google_auth_account = create_google_auth_account(current_user, identity,)
    apply_google_profile_defaults(current_user, identity,)

    db.add(google_auth_account)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        # Re-query after rollback in case another request created the link between our initial check and commit.
        existing_link = find_existing_google_link(db, identity.sub, current_user,)

        if existing_link:
            db.refresh(current_user)
            return current_user

        raise bad_request(
            "Google account could not be linked",
            code=ErrorCode.GOOGLE_LINK_FAILED,
        )

    db.refresh(current_user)

    return current_user
