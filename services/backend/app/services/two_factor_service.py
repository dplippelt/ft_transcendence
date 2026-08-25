import pyotp


TWO_FACTOR_ISSUER = "ft_transcendence"


def generate_two_factor_secret() -> str:
    return pyotp.random_base32()


def generate_provisioning_uri(secret: str, account_name: str,) -> str:
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=account_name, issuer_name=TWO_FACTOR_ISSUER,)


def verify_two_factor_code(secret: str, code: str,) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)  # Allow a 1-step window for clock skew
