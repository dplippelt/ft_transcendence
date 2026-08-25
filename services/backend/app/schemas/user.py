from typing import Any

from pydantic import BaseModel, EmailStr, Field, HttpUrl, field_validator, model_validator


USERNAME_PATTERN = r"^[a-zA-Z0-9_.-]+$"


# {}                           ✓ no username change
# {"display_name": "Bell"}     ✓ no username change
# {"username": "Bell"}         ✓ update username
# {"username": null}           ✗ 422 validation error
# {"username": "a"}            ✗ 422 too short
# {"username": "Bell Wong"}    ✗ 422 invalid characters


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    username: str = Field(
        min_length=3,
        max_length=50,
        pattern=USERNAME_PATTERN,
    )


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    username: str | None = Field(
        default=None,
        min_length=3,
        max_length=50,
        pattern=USERNAME_PATTERN,
    )
    display_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    @model_validator(mode="before")
    @classmethod
    def username_cannot_be_null(cls, data: Any) -> Any:
        if (
            isinstance(data, dict)
            and "username" in data
            and data["username"] is None
        ):
            raise ValueError("Username cannot be null")

        return data

    @field_validator("display_name", mode="before")
    @classmethod
    def strip_display_name(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.strip()

        return value


class UserResponse(BaseModel):
    id: int
    username: str | None = None
    display_name: str | None = None
    avatar_url: str | None = None
    is_guest: bool
    is_active: bool
    two_factor_enabled: bool
    linked_providers: list[str] = Field(
        default_factory=list,
    )

    model_config = {
        "from_attributes": True,
    }


# A reduced, public-safe view of a user for endpoints that look up someone
# other than the current user -- mirrors FriendUserResponse's rationale of
# not exposing internal account state like is_guest/is_active.
class PublicUserResponse(BaseModel):
    id: int
    username: str | None = None
    display_name: str | None = None
    avatar_url: str | None = None
    model_config = {
        "from_attributes": True,
    }


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TwoFactorSetupResponse(BaseModel):
    provisioning_uri: str


class TwoFactorCode(BaseModel):
    code: str = Field(
        min_length=6,
        max_length=6,
        pattern=r"^\d{6}$",
    )


class TwoFactorLogin(BaseModel):
    challenge_token: str
    code: str = Field(
        min_length=6,
        max_length=6,
        pattern=r"^\d{6}$",
    )


class TwoFactorChallenge(BaseModel):
    requires_two_factor: bool = True
    challenge_token: str


class GoogleLogin(BaseModel):
    credential: str


class PasswordUpdate(BaseModel):
    current_password: str | None = None
    new_password: str = Field(min_length=8)
