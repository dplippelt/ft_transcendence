from dataclasses import dataclass
from datetime import timedelta
from typing import Annotated

import cachecontrol
import requests
from fastapi import APIRouter, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from google.auth import exceptions as google_auth_exceptions
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from app.services.two_factor_service import (
    generate_provisioning_uri,
    generate_two_factor_secret,
    verify_two_factor_code,
)
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.dependencies import CurrentUser, DbSession
from app.core.exceptions import (
    ErrorCode, bad_request, conflict, forbidden, service_unavailable, too_many_requests, unauthorized,
)
from app.core.rate_limit import SlidingWindowLimiter
from app.core.security import (
    DUMMY_PASSWORD_HASH,
    create_access_token,
    create_two_factor_challenge_token,
    decode_two_factor_challenge,
    get_password_hash,
    verify_password,
)
from app.core.settings import get_settings
from app.models.auth_account import AuthAccount
from app.models.user import User
from app.schemas.user import (
    GoogleLogin,
    PasswordUpdate,
    Token,
    TwoFactorChallenge,
    TwoFactorCode,
    TwoFactorLogin,
    TwoFactorSetupResponse,
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

# Keyed by client IP rather than the attempted email/username, so a single
# source can't just cycle through target accounts to dodge the limit --
# /login and /token share one limiter since they're both just different
# entry points to the same password check. This is a first layer against
# casual brute-forcing, not full account-level protection: a distributed
# attempt against one account from many IPs isn't caught here and would
# need a per-account (email/username) limiter as well.
LOGIN_RATE_LIMIT_WINDOW = timedelta(minutes=1)
LOGIN_RATE_LIMIT_MAX = 10
_login_rate_limiter = FixedWindowLimiter(LOGIN_RATE_LIMIT_WINDOW, LOGIN_RATE_LIMIT_MAX)

REGISTER_RATE_LIMIT_WINDOW = timedelta(minutes=1)
REGISTER_RATE_LIMIT_MAX = 5
_register_rate_limiter = FixedWindowLimiter(REGISTER_RATE_LIMIT_WINDOW, REGISTER_RATE_LIMIT_MAX)

TWO_FACTOR_RATE_LIMIT_WINDOW = timedelta(minutes=1)
TWO_FACTOR_RATE_LIMIT_MAX = 5
_two_factor_rate_limiter = SlidingWindowLimiter(TWO_FACTOR_RATE_LIMIT_WINDOW, TWO_FACTOR_RATE_LIMIT_MAX)


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _check_login_rate_limit(request: Request) -> None:
    if not _login_rate_limiter.allow(_client_ip(request)):
        raise too_many_requests(
            "Too many login attempts. Try again shortly.",
            code=ErrorCode.LOGIN_RATE_LIMIT_EXCEEDED,
        )


def _check_register_rate_limit(request: Request) -> None:
    if not _register_rate_limiter.allow(_client_ip(request)):
        raise too_many_requests(
            "Too many registration attempts. Try again shortly.",
            code=ErrorCode.REGISTRATION_RATE_LIMIT_EXCEEDED,
        )


def _check_two_factor_rate_limit(request: Request, user_id: int) -> None:
    key = (user_id, _client_ip(request))
    if not _two_factor_rate_limiter.allow(key):
        raise too_many_requests(
            "Too many two-factor authentication attempts. Try again shortly.",
            code=ErrorCode.TWO_FACTOR_RATE_LIMIT_EXCEEDED,
        )


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


def complete_login_for_user(user: User,) -> Token | TwoFactorChallenge:
    if not user.two_factor_enabled:
        return create_token_for_user(user)

    challenge_token  = create_two_factor_challenge_token(user.id)

    return TwoFactorChallenge(challenge_token=challenge_token,)


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
            clock_skew_in_seconds=5,
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


def apply_google_profile_defaults(user: User, identity: GoogleIdentity) -> None:

    if user.display_name is None and identity.display_name is not None :
        user.display_name = identity.display_name

    if user.avatar_url is None and identity.avatar_url is not None:
        user.avatar_url = identity.avatar_url


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
        raise unauthorized(
            "Invalid email or password",
            code=ErrorCode.INVALID_CREDENTIALS,
        )

    return get_active_user_from_auth_account(auth_account)


def get_password_account_for_user(db: Session, user_id: int) -> AuthAccount | None:
    return (
        db.query(AuthAccount)
        .filter(
            AuthAccount.user_id == user_id,
            AuthAccount.provider == PASSWORD_PROVIDER,
        )
        .first()
    )


def get_google_account_by_email(db: Session, email: str,) -> AuthAccount | None:
    return (
        db.query(AuthAccount)
        .filter(
            AuthAccount.provider == GOOGLE_PROVIDER,
            AuthAccount.email == email,
        )
        .first()
    )

def raise_google_email_conflict_if_present(db: Session, email: str,) -> None:
    google_account = get_google_account_by_email(db, email,)

    if google_account:
        raise conflict(
            (
                "A Google account with this email is already "
                "registered under a different Google identity."
            ),
            code=ErrorCode.GOOGLE_EMAIL_CONFLICT,
        )

    password_account = get_password_account_by_email(db, email,)

    if password_account:
        raise conflict(
            (
                "An account with this email already exists. "
                "Sign in with email and password, then link "
                "Google from your account settings."
            ),
            code=ErrorCode.GOOGLE_ACCOUNT_NOT_LINKED,
        )

def get_verified_email_for_user(db: Session, user_id: int) -> str | None:
    auth_account = (
        db.query(AuthAccount)
        .filter(
            AuthAccount.user_id == user_id,
            AuthAccount.email.is_not(None),
            AuthAccount.email_verified.is_(True),
        )
        .first()
    )
    return auth_account.email if auth_account else None


def set_or_change_password(db: Session, user: User, password_data: PasswordUpdate) -> None:
    password_account = get_password_account_for_user(db, user.id,)

    if password_account:
        if not password_data.current_password:
            raise bad_request(
                "Current password is required",
                code=ErrorCode.PASSWORD_REQUIRED,
            )

        if (not password_account.password_hash
            or not verify_password(
                password_data.current_password,
                password_account.password_hash,
            )
        ):
            raise unauthorized(
                "Current password is incorrect",
                code=ErrorCode.INVALID_CURRENT_PASSWORD,
            )

        if verify_password(
            password_data.new_password,
            password_account.password_hash,
        ):
            raise bad_request(
                "New password must be different from current password",
                code=ErrorCode.PASSWORD_SAME_AS_CURRENT,
            )

        password_account.password_hash = get_password_hash(
            password_data.new_password
        )

        try:
            db.commit()
        except SQLAlchemyError:
            db.rollback()
            raise bad_request(
                "Password could not be updated",
                code=ErrorCode.PASSWORD_UPDATE_FAILED,
            )
        return
    email = get_verified_email_for_user(db, user.id,)

    if not email:
        raise bad_request(
            "No verified email is available for this user",
            code=ErrorCode.PASSWORD_EMAIL_UNAVAILABLE,
        )

    existing_password_account = get_password_account_by_email(db, email,)

    if existing_password_account:
        raise conflict(
            "This email is already used by another password account",
            code=ErrorCode.PASSWORD_EMAIL_CONFLICT,
        )

    password_account = AuthAccount(
        user=user,
        provider=PASSWORD_PROVIDER,
        provider_account_id=email,
        email=email,
        email_verified=True,
        password_hash=get_password_hash(
            password_data.new_password,
        ),
    )

    db.add(password_account)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        password_account = get_password_account_for_user(db, user.id,)

        if password_account:
            if (
                password_account.password_hash
                and verify_password(
                    password_data.new_password,
                    password_account.password_hash,
                )
            ):
                return
            raise conflict(
                "A password was set by another request",
                code=ErrorCode.PASSWORD_ALREADY_SET,
            )

        raise conflict(
            "A password account could not be created",
            code=ErrorCode.PASSWORD_UPDATE_FAILED,
        )


def unlink_google_from_user(db: Session, user: User) -> None:
    google_account = get_google_account_for_user(db, user.id,)

    if not google_account:
        raise bad_request(
            "No Google account is linked to this user",
            code=ErrorCode.GOOGLE_NOT_LINKED_TO_UNLINK,
        )

    password_account = get_password_account_for_user(db, user.id,)

    if not password_account or not password_account.password_hash:
        raise conflict(
            "Set a password before unlinking your Google",
            code=ErrorCode.PASSWORD_REQUIRED_TO_UNLINK_GOOGLE,
        )

    db.delete(google_account)

    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise bad_request(
            "Google account could not be unlinked",
            code=ErrorCode.GOOGLE_UNLINK_FAILED,
        )

@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserRegister, db: DbSession, request: Request):
    _check_register_rate_limit(request)

    email = normalize_email(user_data.email)

    existing_auth_account = get_auth_account_by_email(db, email)

    if existing_auth_account:
        raise bad_request(
            "Email already exists",
            code=ErrorCode.EMAIL_ALREADY_EXISTS,
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
        raise bad_request("User could not be registered", code=ErrorCode.REGISTRATION_FAILED)

    db.refresh(user)

    return user


@router.post("/login", response_model=Token | TwoFactorChallenge,)
def login_user(user_data: UserLogin, db: DbSession, request: Request):
    _check_login_rate_limit(request)

    user = authenticate_password_user(
        db,
        user_data.email,
        user_data.password,
    )

    return complete_login_for_user(user)


@router.post("/token", response_model=Token | TwoFactorChallenge,)
def login_for_access_token(form_data: OAuth2Form, db: DbSession, request: Request):
    _check_login_rate_limit(request)

    user = authenticate_password_user(
        db,
        form_data.username,
        form_data.password,
    )

    return complete_login_for_user(user)


@router.post("/google", response_model=Token | TwoFactorChallenge,)
def google_login(user_data: GoogleLogin, db: DbSession):
    identity = verify_google_credential(user_data.credential,)
    google_auth_account = get_google_account_by_sub(db, identity.sub)

    if google_auth_account:
        user = get_active_user_from_auth_account(google_auth_account,)

        return complete_login_for_user(user)

    raise_google_email_conflict_if_present(
        db,
        identity.email,
    )

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

        existing_google_account = get_google_account_by_sub(db, identity.sub,)

        if existing_google_account:
            user = get_active_user_from_auth_account(existing_google_account,)

            return complete_login_for_user(user)

        raise_google_email_conflict_if_present(db, identity.email,)

        raise bad_request(
            "Google account could not be registered",
            code=ErrorCode.GOOGLE_REGISTRATION_FAILED,
        )

    db.refresh(user)

    return complete_login_for_user(user)

@router.post("/google/link", response_model=UserResponse)
def link_google_account(user_data: GoogleLogin,db: DbSession, current_user: CurrentUser):
    identity = verify_google_credential(user_data.credential)
    existing_link = find_existing_google_link(db, identity.sub, current_user)

    if existing_link:
        return current_user

    google_auth_account = create_google_auth_account(current_user, identity,)
    db.add(google_auth_account)
    apply_google_profile_defaults(current_user, identity,)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        existing_link = find_existing_google_link(db, identity.sub, current_user,)

        if existing_link:
            return current_user

        raise bad_request(
            "Google account could not be linked",
            code=ErrorCode.GOOGLE_LINK_FAILED,
        )

    return current_user


@router.delete("/google/link", response_model=UserResponse,)
def unlink_google_account(db: DbSession, current_user: CurrentUser,):
    unlink_google_from_user(db, current_user,)

    db.refresh(current_user)
    return current_user

@router.put("/password", response_model=UserResponse,)
def update_password(password_data: PasswordUpdate, db: DbSession, current_user: CurrentUser, ):
    set_or_change_password(db, current_user, password_data,)
    db.refresh(current_user)
    return current_user


# 2FA off  + password → access token
# 2FA off  + Google   → access token

# 2FA on   + password → challenge token
# 2FA on   + Google   → challenge token

# challenge + wrong code   → 401
# challenge + correct code → access token
# expired challenge        → 401
# normal access JWT sent as challenge → 401
# 6th 2FA attempt within 1 min → 429

@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
def setup_two_factor(db: DbSession, current_user: CurrentUser,):
    if current_user.two_factor_enabled:
        raise conflict(
            "Two-factor authentication is already enabled",
            code=ErrorCode.TWO_FACTOR_ALREADY_ENABLED,
        )

    if current_user.two_factor_secret is None:
        current_user.two_factor_secret = generate_two_factor_secret()
        
        try:
            db.commit()
        except SQLAlchemyError:
            db.rollback()
            raise bad_request(
                "Two-factor authentication setup failed",
                code=ErrorCode.TWO_FACTOR_FAILED,
        )

    secret = current_user.two_factor_secret
    email = get_verified_email_for_user(db, current_user.id,)
    account_name = email or current_user.username or f"user-{current_user.id}"

    return TwoFactorSetupResponse(
        provisioning_uri=generate_provisioning_uri(secret, account_name,)
    )


@router.post("/2fa/confirm", response_model=UserResponse)
def confirm_two_factor(data: TwoFactorCode, db: DbSession, current_user: CurrentUser, request: Request,):
    _check_two_factor_rate_limit(request, current_user.id)
    secret = current_user.two_factor_secret

    if secret is None:
        raise bad_request(
            "Two-factor authentication is not set up for this user",
            code=ErrorCode.TWO_FACTOR_SETUP_REQUIRED,
        )

    if current_user.two_factor_enabled:
        raise conflict(
            "Two-factor authentication is already enabled",
            code=ErrorCode.TWO_FACTOR_ALREADY_ENABLED,
        )

    if not verify_two_factor_code(secret, data.code):
        raise unauthorized(
            "Invalid two-factor authentication code",
            code=ErrorCode.INVALID_TWO_FACTOR_CODE,
        )

    current_user.two_factor_enabled = True

    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise bad_request(
            "Two-factor authentication confirmation failed",
            code=ErrorCode.TWO_FACTOR_FAILED,
        )
    db.refresh(current_user)
    return current_user


@router.post("/2fa/login", response_model=Token)
def two_factor_login(data: TwoFactorLogin, db: DbSession, request: Request,):
    user_id = decode_two_factor_challenge(data.challenge_token,)

    if user_id is None:
        raise unauthorized(
            "Invalid or expired two-factor authentication challenge",
            code=ErrorCode.TWO_FACTOR_CHALLENGE_INVALID,
        )

    _check_two_factor_rate_limit(request, user_id)
    user = db.query(User).filter(User.id == user_id).first()

    if user is None or not user.is_active:
        raise unauthorized(
            "Invalid or expired two-factor authentication challenge",
            code=ErrorCode.TWO_FACTOR_CHALLENGE_INVALID,
        )

    if not user.two_factor_enabled:
        raise unauthorized(
            "Two-factor authentication is not enabled",
            code=ErrorCode.TWO_FACTOR_NOT_ENABLED,
        )

    secret = user.two_factor_secret

    if secret is None:
        raise unauthorized(
            "Two-factor authentication setup is invalid",
            code=ErrorCode.TWO_FACTOR_CHALLENGE_INVALID,
        )

    if not verify_two_factor_code(secret, data.code):
        raise unauthorized(
            "Invalid two-factor authentication code",
            code=ErrorCode.INVALID_TWO_FACTOR_CODE,
        )

    return create_token_for_user(user)

# @router.delete("/2fa", response_model=UserResponse)
