import hashlib
import hmac
import secrets

import pyotp
from cryptography.fernet import Fernet

from app.core.settings import get_settings

settings = get_settings()

_two_factor_fernet = Fernet(settings.two_factor_encryption_key.encode())

TWO_FACTOR_ISSUER = "ft_transcendence"

RECOVERY_CODE_COUNT = 10
RECOVERY_CODE_LENGTH = 16

RECOVERY_CODE_ALPHABET = ("ABCDEFGHJKLMNPQRSTUVWXYZ23456789")


def generate_two_factor_secret() -> str:
    return pyotp.random_base32()


def generate_provisioning_uri(secret: str, account_name: str,) -> str:
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=account_name, issuer_name=TWO_FACTOR_ISSUER,)


def verify_two_factor_code(secret: str, code: str,) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)  # Allow a 1-step window for clock skew


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
        settings.secret_key.encode(),
        normalized.encode(),
        hashlib.sha256,
    ).hexdigest()


def encrypt_two_factor_secret(secret: str) -> str:
    return _two_factor_fernet.encrypt(secret.encode()).decode()


def decrypt_two_factor_secret(encrypted_secret: str) -> str:
    return _two_factor_fernet.decrypt(encrypted_secret.encode()).decode()
