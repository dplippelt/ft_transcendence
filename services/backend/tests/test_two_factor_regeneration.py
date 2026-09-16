import pyotp

from app.models.two_factor_recovery_code import TwoFactorRecoveryCode
from app.services.two_factor_service import (
    RECOVERY_CODE_COUNT,
    hash_recovery_code,
)


def test_regenerate_recovery_codes_success(
    client,
    db,
    auth_headers,
    two_factor_enabled_user,
):
    # Arrange
    user, secret = two_factor_enabled_user
    old_recovery_code = "ABCD-EFGH-JKLM-NPQR"

    db.add(
        TwoFactorRecoveryCode(
            user_id=user.id,
            code_hash=hash_recovery_code(old_recovery_code),
        )
    )
    db.commit()

    valid_code = pyotp.TOTP(secret).now()

    # Act
    response = client.post(
        "/auth/2fa/recovery-codes",
        headers=auth_headers,
        json={"code": valid_code},
    )

    # Assert
    assert response.status_code == 200

    recovery_codes = response.json()["recovery_codes"]
    assert len(recovery_codes) == RECOVERY_CODE_COUNT
    assert len(recovery_codes) == len(set(recovery_codes))

    old_code = (
        db.query(TwoFactorRecoveryCode)
        .filter(
            TwoFactorRecoveryCode.user_id == user.id,
            TwoFactorRecoveryCode.code_hash
            == hash_recovery_code(old_recovery_code),
        )
        .first()
    )
    assert old_code is None


def test_regenerate_recovery_codes_rejects_wrong_code(
    client,
    auth_headers,
    two_factor_enabled_user,
    monkeypatch,
):
    # Arrange
    _user, _secret = two_factor_enabled_user

    from app.api.v1 import auth

    monkeypatch.setattr(
        auth,
        "match_unused_encrypted_two_factor_timecode",
        lambda encrypted_secret, code, last_used: None,
    )

    # Act
    response = client.post(
        "/auth/2fa/recovery-codes",
        headers=auth_headers,
        json={"code": "123456"},
    )

    # Assert
    assert response.status_code == 401
    assert (
        response.json()["detail"]["code"]
        == "INVALID_TWO_FACTOR_CODE"
    )


def test_regenerate_recovery_codes_when_two_factor_not_enabled(
    client,
    auth_headers,
):
    # Act
    response = client.post(
        "/auth/2fa/recovery-codes",
        headers=auth_headers,
        json={"code": "123456"},
    )

    # Assert
    assert response.status_code == 400
    assert (
        response.json()["detail"]["code"]
        == "TWO_FACTOR_NOT_ENABLED"
    )


def test_management_totp_cannot_be_reused_to_disable_after_regeneration(
    client,
    auth_headers,
    two_factor_enabled_user,
):
    # Arrange
    _, secret = two_factor_enabled_user
    valid_code = pyotp.TOTP(secret).now()

    regenerate_response = client.post(
        "/auth/2fa/recovery-codes",
        headers=auth_headers,
        json={"code": valid_code},
    )
    assert regenerate_response.status_code == 200

    # Act
    disable_response = client.request(
        "DELETE",
        "/auth/2fa",
        headers=auth_headers,
        json={"code": valid_code},
    )

    # Assert
    assert disable_response.status_code == 401
    assert (
        disable_response.json()["detail"]["code"]
        == "INVALID_TWO_FACTOR_CODE"
    )
