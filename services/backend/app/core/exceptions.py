from enum import StrEnum

from fastapi import HTTPException, status


class ErrorCode(StrEnum):
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    INVALID_TOKEN = "INVALID_TOKEN"
    ACCOUNT_INACTIVE = "ACCOUNT_INACTIVE"
    NOT_SELF_ACCOUNT = "NOT_SELF_ACCOUNT"
    USERNAME_REQUIRED = "USERNAME_REQUIRED"
    AVATAR_BAD_FILE_TYPE = "AVATAR_BAD_FILE_TYPE"
    AVATAR_TOO_LARGE = "AVATAR_TOO_LARGE"

    EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS"
    USERNAME_ALREADY_EXISTS = "USERNAME_ALREADY_EXISTS"
    REGISTRATION_FAILED = "REGISTRATION_FAILED"

    GOOGLE_NOT_CONFIGURED = "GOOGLE_NOT_CONFIGURED"
    INVALID_GOOGLE_CREDENTIALS = "INVALID_GOOGLE_CREDENTIALS"
    GOOGLE_SUBJECT_MISSING = "GOOGLE_SUBJECT_MISSING"
    GOOGLE_EMAIL_MISSING = "GOOGLE_EMAIL_MISSING"
    GOOGLE_EMAIL_NOT_VERIFIED = "GOOGLE_EMAIL_NOT_VERIFIED"

    GOOGLE_ACCOUNT_NOT_LINKED = "GOOGLE_ACCOUNT_NOT_LINKED"
    GOOGLE_ACCOUNT_ALREADY_LINKED = "GOOGLE_ACCOUNT_ALREADY_LINKED"
    GOOGLE_PROVIDER_ALREADY_LINKED = "GOOGLE_PROVIDER_ALREADY_LINKED"
    GOOGLE_LINK_FAILED = "GOOGLE_LINK_FAILED"
    GOOGLE_REGISTRATION_FAILED = "GOOGLE_REGISTRATION_FAILED"
    GOOGLE_EMAIL_CONFLICT = "GOOGLE_EMAIL_CONFLICT"
    GOOGLE_UNLINK_FAILED = "GOOGLE_UNLINK_FAILED"
    GOOGLE_NOT_LINKED_TO_UNLINK = "GOOGLE_NOT_LINKED_TO_UNLINK"

    PASSWORD_REQUIRED = "PASSWORD_REQUIRED"
    INVALID_CURRENT_PASSWORD = "INVALID_CURRENT_PASSWORD"
    PASSWORD_SAME_AS_CURRENT = "PASSWORD_SAME_AS_CURRENT"
    PASSWORD_EMAIL_UNAVAILABLE = "PASSWORD_EMAIL_UNAVAILABLE"
    PASSWORD_EMAIL_CONFLICT = "PASSWORD_EMAIL_CONFLICT"
    PASSWORD_UPDATE_FAILED = "PASSWORD_UPDATE_FAILED"
    PASSWORD_REQUIRED_TO_UNLINK_GOOGLE = "PASSWORD_REQUIRED_TO_UNLINK_GOOGLE"
    PASSWORD_ALREADY_SET = "PASSWORD_ALREADY_SET"

    USER_NOT_FOUND = "USER_NOT_FOUND"
    DUNGEON_NOT_FOUND = "DUNGEON_NOT_FOUND"
    CANNOT_ADD_SELF = "CANNOT_ADD_SELF"
    CANNOT_REMOVE_SELF = "CANNOT_REMOVE_SELF"
    ALREADY_FRIENDS = "ALREADY_FRIENDS"
    FRIENDSHIP_NOT_FOUND = "FRIENDSHIP_NOT_FOUND"
    FRIEND_REQUEST_ALREADY_SENT = "FRIEND_REQUEST_ALREADY_SENT"
    FRIEND_REQUEST_NOT_FOUND = "FRIEND_REQUEST_NOT_FOUND"
    FRIEND_REQUEST_NOT_PENDING = "FRIEND_REQUEST_NOT_PENDING"
    INVALID_FRIEND_REQUEST_STATE = "INVALID_FRIEND_REQUEST_STATE"
    NOT_FRIEND_REQUEST_RECIPIENT = "NOT_FRIEND_REQUEST_RECIPIENT"
    NOT_FRIEND_REQUEST_REQUESTER = "NOT_FRIEND_REQUEST_REQUESTER"

    NOT_FRIENDS = "NOT_FRIENDS"
    CANNOT_MESSAGE_SELF = "CANNOT_MESSAGE_SELF"

    LOBBY_NOT_FOUND = "LOBBY_NOT_FOUND"
    LOBBY_FULL = "LOBBY_FULL"
    LOBBY_NAME_ALREADY_EXISTS = "LOBBY_NAME_ALREADY_EXISTS"
    NOT_LOBBY_HOST = "NOT_LOBBY_HOST"
    NOT_LOBBY_MEMBER = "NOT_LOBBY_MEMBER"
    ALREADY_LOBBY_MEMBER = "ALREADY_LOBBY_MEMBER"
    CANNOT_INVITE_SELF = "CANNOT_INVITE_SELF"
    INVITE_ALREADY_SENT = "INVITE_ALREADY_SENT"
    INVITE_RATE_LIMIT_EXCEEDED = "INVITE_RATE_LIMIT_EXCEEDED"
    LOBBY_MESSAGE_SEND_FAILED = "LOBBY_MESSAGE_SEND_FAILED"
    LOBBY_MISSING_PLAYERS = "LOBBY_MISSING_PLAYERS"
    LOBBY_GAME_SESSION_CRASH = "LOBBY_GAME_SESSION_CRASH"

    LOGIN_RATE_LIMIT_EXCEEDED = "LOGIN_RATE_LIMIT_EXCEEDED"
    REGISTRATION_RATE_LIMIT_EXCEEDED = "REGISTRATION_RATE_LIMIT_EXCEEDED"

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


def conflict(detail: str, code: ErrorCode | None = None,) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=error_detail(detail, code),
    )


def too_many_requests(detail: str, code: ErrorCode | None = None,) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail=error_detail(detail, code),
    )

def internal_server_error(detail: str, code: ErrorCode | None = None) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=error_detail(detail, code)
    )
