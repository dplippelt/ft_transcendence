from datetime import timedelta

from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_token,
    create_two_factor_challenge_token,
    decode_two_factor_challenge,
)


def test_password_hash_can_be_verified():
    # Arrange
    password = "TestPassword123!"

    # Act
    hashed_password = get_password_hash(password)

    # Assert
    assert verify_password(password, hashed_password) is True


def test_password_hash_cannot_be_verified_with_wrong_password():
    # Arrange
    password = "TestPassword123!"
    wrong_password = "WrongPassword456!"
    hashed_password = get_password_hash(password)

    # Act
    result = verify_password(wrong_password, hashed_password)

    # Assert
    assert result is False


def test_password_hash_is_not_plain_password():
    # Arrange
    password = "TestPassword123!"

    # Act
    hashed_password = get_password_hash(password)

    # Assert
    assert hashed_password != password


def test_access_token_can_be_decoded():
    # Arrange
    user_id = 42

    # Act
    token = create_access_token(data={"sub": str(user_id)},)
    payload = decode_token(token)

    # Assert
    assert payload is not None
    assert payload["sub"] == str(user_id)
    assert payload["purpose"] == "access"
    

def test_expired_access_token_returns_none():
    # Arrange
    token = create_access_token(
        data={"sub": "42"},
        expires_delta=timedelta(seconds=-1),
    )

    # Act
    payload = decode_token(token)

    # Assert
    assert payload is None


def test_invalid_token_returns_none():
    # Act
    payload = decode_token("invalid_token")

    # Assert
    assert payload is None


def test_two_factor_challenge_returns_user_id():
    # Arrange
    user_id = 42

    # Act
    token = create_two_factor_challenge_token(user_id)
    decoded_user_id = decode_two_factor_challenge(token)

    # Assert
    assert decoded_user_id == user_id


def test_access_token_cannot_be_used_as_two_factor_challenge():
    # Arrange
    token = create_access_token(data={"sub": "42"})

    # Act
    decoded_user_id = decode_two_factor_challenge(token)

    # Assert
    assert decoded_user_id is None
