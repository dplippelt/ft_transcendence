from enum import StrEnum

from fastapi import HTTPException, status


class ErrorCode(StrEnum):
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    ACCOUNT_INACTIVE = "ACCOUNT_INACTIVE"

    EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS"
    USERNAME_ALREADY_EXISTS = "USERNAME_ALREADY_EXISTS"
    REGISTRATION_FAILED = "REGISTRATION_FAILED"

    GOOGLE_NOT_CONFIGURED = "GOOGLE_NOT_CONFIGURED"
    INVALID_GOOGLE_CREDENTIALS = "INVALID_GOOGLE_CREDENTIALS"
    GOOGLE_SUBJECT_MISSING = "GOOGLE_SUBJECT_MISSING"
    GOOGLE_EMAIL_MISSING = "GOOGLE_EMAIL_MISSING"
    GOOGLE_EMAIL_NOT_VERIFIED = "GOOGLE_EMAIL_NOT_VERIFIED"
    GOOGLE_LINK_FAILED = "GOOGLE_LINK_FAILED"
    GOOGLE_REGISTRATION_FAILED = "GOOGLE_REGISTRATION_FAILED"

def error_detail(message: str, code: ErrorCode | None = None,) -> str | dict[str, str]:
    if code is None:
        return message

    return {
        "code": code.value,
        "message": message,
    }


def bad_request(detail: str, code: ErrorCode | None = None,) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=error_detail(detail, code),
    )


def unauthorized(detail: str = "Invalid authentication credentials", code: ErrorCode | None = None,) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=error_detail(detail, code),
        headers={"WWW-Authenticate": "Bearer"},
    )


def forbidden(detail: str, code: ErrorCode | None = None,) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=error_detail(detail, code),
    )


def not_found(detail: str, code: ErrorCode | None = None,) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=error_detail(detail, code),
    )


def service_unavailable(detail: str, code: ErrorCode | None = None,) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=error_detail(detail, code),
    )
