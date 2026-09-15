import pyotp
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models
from app.api.v1 import auth
from app.core.rate_limit import FixedWindowLimiter
from app.core.security import create_access_token, get_password_hash
from app.db.database import Base, get_db
from app.models.auth_account import AuthAccount
from app.models.user import User

# create an SQLite database entirely in memory
TEST_DATABASE_URL = "sqlite+pysqlite:///:memory:"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "TestPassword123!"
TEST_USERNAME = "testuser"

engine = create_engine(
    TEST_DATABASE_URL,
    # FastAPI's TestClient makes requests in separate threads,
    # so this allows the test env to share the SQLite connection
    connect_args={"check_same_thread": False},
    # keep reusing the same connection
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

@pytest.fixture()
def db():
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def app(db, monkeypatch):
    test_app = FastAPI()

    test_app.include_router(
        auth.router,
        prefix="/auth",
    )

    def override_get_db():
        yield db

    # this avoids executing the real get_db dependency
    test_app.dependency_overrides[get_db] = override_get_db

    #reset rate-limit for each test
    monkeypatch.setattr(
        auth,
        "_login_rate_limiter",
        FixedWindowLimiter(
            auth.LOGIN_RATE_LIMIT_WINDOW,
            auth.LOGIN_RATE_LIMIT_MAX,
        ),
    )

    monkeypatch.setattr(
        auth,
        "_register_rate_limiter",
        FixedWindowLimiter(
            auth.REGISTER_RATE_LIMIT_WINDOW,
            auth.REGISTER_RATE_LIMIT_MAX,
        ),
    )

    monkeypatch.setattr(
        auth,
        "_two_factor_rate_limiter",
        FixedWindowLimiter(
            auth.TWO_FACTOR_RATE_LIMIT_WINDOW,
            auth.TWO_FACTOR_RATE_LIMIT_MAX,
        ),
    )

    try:
        yield test_app
    finally:
        test_app.dependency_overrides.clear()

@pytest.fixture()
def client(app):
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def user_credentials():
    return {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
    }


@pytest.fixture()
def user(db, user_credentials):
    user = User (
        username=TEST_USERNAME,
        display_name="Test User",
        is_guest=False,
        is_active=True,
        two_factor_enabled=False,
        two_factor_secret=None,
    )

    password_account = AuthAccount(
        user=user,
        provider=auth.PASSWORD_PROVIDER,
        provider_account_id=user_credentials["email"],
        email=user_credentials["email"],
        email_verified=True,
        password_hash=get_password_hash(user_credentials["password"]),
    )

    db.add(user)
    db.add(password_account)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def auth_headers(user):
    access_token = create_access_token(
        data={"sub": str(user.id)},
    )
    return {
        "Authorization": f"Bearer {access_token}",
    }


@pytest.fixture()
def two_factor_secret_user(db, user):
    secret = pyotp.random_base32()

    user.two_factor_secret = auth.encrypt_two_factor_secret(secret)
    user.two_factor_enabled = False

    db.commit()
    db.refresh(user)

    return user, secret


@pytest.fixture()
def two_factor_enabled_user(db, two_factor_secret_user,):
    user, secret = two_factor_secret_user

    user.two_factor_enabled = True

    db.commit()
    db.refresh(user)

    return user, secret
