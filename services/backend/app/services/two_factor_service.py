import hashlib
import hmac
import secrets
import time

import pyotp
from cryptography.fernet import Fernet

from app.core.settings import get_settings

settings = get_settings()

_two_factor_fernet = Fernet(settings.two_factor_encryption_key.encode())

TWO_FACTOR_ISSUER = "ft_transcendence"

RECOVERY_CODE_COUNT = 10
RECOVERY_CODE_LENGTH = 16

RECOVERY_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def generate_two_factor_secret() -> str:
    return pyotp.random_base32()


def generate_provisioning_uri(secret: str, account_name: str,) -> str:
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(
        name=account_name,
        issuer_name=TWO_FACTOR_ISSUER,
    )


def verify_two_factor_code(secret: str, code: str,) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(
        code,
        valid_window=1,
    )


def verify_encrypted_two_factor_code(
    encrypted_secret: str,
    code: str,
) -> bool:
    secret = decrypt_two_factor_secret(encrypted_secret)
    return verify_two_factor_code(secret, code)


def match_unused_encrypted_two_factor_timecode(
    encrypted_secret: str,
    code: str,
    last_used_timecode: int | None,
) -> int | None:
    """
    Return the TOTP time-step matched by `code`, but only when it is newer
    than the last management code already consumed for this user.

    This is intended for sensitive account-management operations such as
    regenerating recovery codes or disabling 2FA. Login verification remains
    non-consuming so signing in does not block immediate account management.
    """
    secret = decrypt_two_factor_secret(encrypted_secret)
    totp = pyotp.TOTP(secret)
    current_timecode = int(time.time()) // totp.interval

    for offset in (-1, 0, 1):
        timecode = current_timecode + offset

        if (
            last_used_timecode is not None
            and timecode <= last_used_timecode
        ):
            continue

        expected_code = totp.generate_otp(timecode)

        if hmac.compare_digest(expected_code, code):
            return timecode

    return None


def generate_recovery_code() -> str:
    raw = "".join(
        secrets.choice(RECOVERY_CODE_ALPHABET)
        for _ in range(RECOVERY_CODE_LENGTH)
    )

    return "-".join(
        raw[i:i + 4]
        for i in range(0, len(raw), 4)
    )


def generate_recovery_codes() -> list[str]:
    return [
        generate_recovery_code()
        for _ in range(RECOVERY_CODE_COUNT)
    ]


def normalize_recovery_code(code: str) -> str:
    return (
        code
        .replace("-", "")
        .replace(" ", "")
        .upper()
    )


def hash_recovery_code(code: str) -> str:
    normalized = normalize_recovery_code(code)

    return hmac.new(
        settings.two_factor_recovery_hmac_key.encode(),
        normalized.encode(),
        hashlib.sha256,
    ).hexdigest()


def encrypt_two_factor_secret(secret: str) -> str:
    return _two_factor_fernet.encrypt(secret.encode()).decode()


def decrypt_two_factor_secret(encrypted_secret: str) -> str:
    return _two_factor_fernet.decrypt(encrypted_secret.encode()).decode()
