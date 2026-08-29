import pyotp

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
