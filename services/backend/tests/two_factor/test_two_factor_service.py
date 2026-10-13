import pyotp

from app.core.security import (
    create_access_token,
    create_two_factor_challenge_token,
)
from app.services.two_factor_service import (
    RECOVERY_CODE_COUNT,
    generate_provisioning_uri,
    generate_recovery_codes,
    verify_two_factor_code,
)


def test_valid_two_factor_code_is_accepted():
    # Arrange
    secret = pyotp.random_base32()
    code = pyotp.TOTP(secret).now()

    # Act
    result = verify_two_factor_code(secret, code)
    
    # Assert
    assert result is True


def test_invalid_two_factor_code_is_rejected():
    # Arrange
    secret = pyotp.random_base32()

    # Act
    result = verify_two_factor_code(secret, "invalid")
    
    # Assert
    assert result is False


def test_provisioning_uri_contains_information_needed_by_authenticator():
    # Arrange
    secret = pyotp.random_base32()
    account_name = "test@example.com"

    # Act
    uri = generate_provisioning_uri(
        secret,
        account_name,
    )

    # Assert
    assert uri.startswith("otpauth://totp/")
    assert f"secret={secret}" in uri
    assert "issuer=ft_transcendence" in uri


def test_recovery_codes_are_generated_in_expected_quantity_and_format():
    # Act
    codes = generate_recovery_codes()

    # Assert
    assert len(codes) == RECOVERY_CODE_COUNT

    for code in codes:
        parts = code.split("-")

        assert len(parts) == 4
        assert all(len(part) == 4 for part in parts)


def test_generated_recovery_codes_are_unique():
    # Act
    codes = generate_recovery_codes()

    # Assert
    assert len(codes) == len(set(codes))


def test_disable_two_factor_success(client, auth_headers, two_factor_enabled_user,):
    # Arrange
    _, secret = two_factor_enabled_user
    valid_code = pyotp.TOTP(secret).now()

    # Act
    response = client.request(
        "DELETE",
        "/auth/2fa",
        headers=auth_headers,
        json={
            "code": valid_code,
        },
    )

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["two_factor_enabled"] is False


def test_two_factor_recovery_code_is_single_use(client, auth_headers, two_factor_secret_user,):
    # Arrange
    user, secret = two_factor_secret_user

    confirm_response = client.post(
        "/auth/2fa/confirm",
        headers=auth_headers,
        json={
            "code": pyotp.TOTP(secret).now(),
        },
    )

    assert confirm_response.status_code == 200

    recovery_code = confirm_response.json()["recovery_codes"][0]

    challenge_token = create_two_factor_challenge_token(
        user.id,
    )

    # Act - first use
    response = client.post(
        "/auth/2fa/recovery",
        json={
            "challenge_token": challenge_token,
            "recovery_code": recovery_code,
        },
    )

    # Assert
    assert response.status_code == 200
    assert "access_token" in response.json()

    # Act - reuse
    response = client.post(
        "/auth/2fa/recovery",
        json={
            "challenge_token": challenge_token,
            "recovery_code": recovery_code,
        },
    )

    # Assert
    assert response.status_code == 401
    assert (
        response.json()["detail"]["code"]
        == "INVALID_TWO_FACTOR_RECOVERY_CODE"
    )


def test_two_factor_recovery_accepts_normalized_code(client, auth_headers, two_factor_secret_user,):
    # Arrange
    user, secret = two_factor_secret_user

    confirm_response = client.post(
        "/auth/2fa/confirm",
        headers=auth_headers,
        json={
            "code": pyotp.TOTP(secret).now(),
        },
    )

    recovery_code = confirm_response.json()["recovery_codes"][0]
    normalized_input = recovery_code.lower().replace("-", " ")

    # Act
    response = client.post(
        "/auth/2fa/recovery",
        json={
            "challenge_token":
                create_two_factor_challenge_token(user.id),
            "recovery_code": normalized_input,
        },
    )

    # Assert
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_access_token_cannot_be_used_for_two_factor_recovery(client, user,):
    # Arrange
    access_token = create_access_token(
        data={"sub": str(user.id)},
    )

    # Act
    response = client.post(
        "/auth/2fa/recovery",
        json={
            "challenge_token": access_token,
            "recovery_code": "AAAA-BBBB-CCCC-DDDD",
        },
    )

    # Assert
    assert response.status_code == 401
    assert (response.json()["detail"]["code"] == "TWO_FACTOR_CHALLENGE_INVALID")
