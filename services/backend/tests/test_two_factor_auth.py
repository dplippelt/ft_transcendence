import pyotp

from app.api.v1 import auth
from app.core.security import create_two_factor_challenge_token
from sqlalchemy.exc import SQLAlchemyError


def test_confirm_two_factor_without_setup(client, auth_headers):
    # Arrange
    # User exists, but two_factor_secret is None

    # Act
    response = client.post(
        "/auth/2fa/confirm",
        headers=auth_headers,
        json={"code": "123456"},
    )

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "TWO_FACTOR_SETUP_REQUIRED"


def test_confirm_two_factor_success(client, db, user, auth_headers,):
    # Arrange
    secret = pyotp.random_base32()

    user.two_factor_secret = secret
    user.two_factor_enabled = False
    db.commit()

    valid_code = pyotp.TOTP(secret).now()

    # Act
    response = client.post(
        "/auth/2fa/confirm",
        headers=auth_headers,
        json={
            "code": valid_code,
        },
    )

    # Assert
    assert response.status_code == 200
    db.refresh(user)
    assert user.two_factor_enabled is True


def test_confirm_two_factor_with_wrong_code(client, db, user, auth_headers, monkeypatch):
    # Arrange
    user.two_factor_secret = pyotp.random_base32()
    user.two_factor_enabled = False
    db.commit()

    monkeypatch.setattr(
        auth,
        "verify_two_factor_code",
        lambda secret, code: False,
    )

    # Act
    response = client.post(
        "/auth/2fa/confirm",
        headers=auth_headers,
        json={"code": "123456"},
    )

    # Assert
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "INVALID_TWO_FACTOR_CODE"


def test_disable_two_factor_when_not_enabled(client, auth_headers):
    # Act
    response = client.request(
        "DELETE",
        "/auth/2fa",
        headers=auth_headers,
        json={"code": "123456"},
    )

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "TWO_FACTOR_NOT_ENABLED"


def test_setup_two_factor_success(client, db, user, auth_headers, user_credentials,):
    # Act
    response = client.post(
        "/auth/2fa/setup",
        headers=auth_headers,
        json={"current_password": user_credentials["password"],},
    )

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "provisioning_uri" in data
    assert data["provisioning_uri"].startswith("otpauth://totp/")
    db.refresh(user)
    assert user.two_factor_secret is not None
    assert user.two_factor_enabled is False


def test_setup_two_factor_when_already_enabled(client, db, user, auth_headers):
    # Arrange
    user.two_factor_enabled = True
    user.two_factor_secret = pyotp.random_base32()
    db.commit()

    # Act
    response = client.post(
        "/auth/2fa/setup",
        headers=auth_headers,
        json={"current_password": "TestPassword123!"},
    )

    # Assert
    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "TWO_FACTOR_ALREADY_ENABLED"


def test_setup_two_factor_requires_one_reauthentication_method(client, auth_headers):
    # Act
    response = client.post(
        "/auth/2fa/setup",
        headers=auth_headers,
        json={},
    )

    # Assert
    assert response.status_code == 422
    errors = response.json()["detail"]

    assert any(
        "Provide exactly one reauthentication method"
        in error["msg"]
        for error in errors
    )


def test_setup_two_factor_with_wrong_password(client, auth_headers):
    # Act
    response = client.post(
        "/auth/2fa/setup",
        headers=auth_headers,
        json={"current_password": "WrongPassword123!"},
    )

    # Assert
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "INVALID_CURRENT_PASSWORD"


def test_setup_two_factor_rejects_multiple_reauthentication_methods(client, auth_headers,):
    # Act
    response = client.post(
        "/auth/2fa/setup",
        headers=auth_headers,
        json={
            "current_password": "TestPassword123!",
            "google_credential": "fake-google-credential",
        },
    )

    assert response.status_code == 422


def test_two_factor_login_success(client, db, user,):
    # Arrange
    secret = pyotp.random_base32()

    user.two_factor_secret = secret
    user.two_factor_enabled = True
    db.commit()

    challenge_token = create_two_factor_challenge_token(
        user.id,
    )

    valid_code = pyotp.TOTP(secret).now()

    # Act
    response = client.post(
        "/auth/2fa/login",
        json={
            "challenge_token": challenge_token,
            "code": valid_code,
        },
    )

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_two_factor_login_with_invalid_challenge(client):
    # Act
    response = client.post(
        "/auth/2fa/login",
        json={
            "challenge_token": "not-a-real-token",
            "code": "123456",
        },
    )

    # Assert
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "TWO_FACTOR_CHALLENGE_INVALID"


def test_two_factor_login_when_not_enabled(client, user):
    # Arrange
    challenge_token = create_two_factor_challenge_token(user.id)

    # Act
    response = client.post(
        "/auth/2fa/login",
        json={
            "challenge_token": challenge_token,
            "code": "123456",
        },
    )

    # Assert
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "TWO_FACTOR_NOT_ENABLED"


def test_password_login_with_two_factor_enabled_returns_challenge(client, db, user, user_credentials,):
    # Arrange
    user.two_factor_enabled = True
    user.two_factor_secret = pyotp.random_base32()
    db.commit()

    # Act
    response = client.post(
        "/auth/login",
        json={
            "email": user_credentials["email"],
            "password": user_credentials["password"],
        },
    )

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "challenge_token" in data


def test_two_factor_rate_limit(client, db, user, auth_headers, monkeypatch):
    # Arrange
    user.two_factor_secret = pyotp.random_base32()
    user.two_factor_enabled = False
    db.commit()

    monkeypatch.setattr(
        auth,
        "verify_two_factor_code",
        lambda secret, code: False,
    )

    # Act
    for _ in range(auth.TWO_FACTOR_RATE_LIMIT_MAX):
        response = client.post(
            "/auth/2fa/confirm",
            headers=auth_headers,
            json={"code": "123456"},
        )

        assert response.status_code == 401

    # The next request exceeds the limit.
    response = client.post(
        "/auth/2fa/confirm",
        headers=auth_headers,
        json={"code": "123456"},
    )

    # Assert
    assert response.status_code == 429
    assert (
        response.json()["detail"]["code"]
        == "TWO_FACTOR_RATE_LIMIT_EXCEEDED"
    )


def test_setup_two_factor_when_database_commit_fails(client, db, auth_headers, user_credentials, monkeypatch,):
    # Arrange
    def fail_commit():
        raise SQLAlchemyError()

    monkeypatch.setattr(db, "commit", fail_commit,)

    # Act
    response = client.post(
        "/auth/2fa/setup",
        headers=auth_headers,
        json={
            "current_password": user_credentials["password"],
        },
    )

    # Assert
    assert response.status_code == 400
    assert (
        response.json()["detail"]["code"]
        == "TWO_FACTOR_FAILED"
    )
