from app.core.security import (
    get_password_hash,
    verify_password,
)

def test_password_hash_can_be_verified():
    # Arrange
    password = "TestPassword123!"

    # Act
    hashed_password = get_password_hash(password)

    # Assert
    assert verify_password(password, hashed_password) is True
