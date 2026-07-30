from pydantic import BaseModel, EmailStr, Field, HttpUrl


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    username: str | None = Field(default=None, min_length=3, max_length=50)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=50)
    display_name: str | None = Field(default=None, max_length=100)
    avatar_url: HttpUrl | None = Field(default=None, max_length=500)


class UserResponse(BaseModel):
    id: int
    username: str | None = None
    display_name: str | None = None
    avatar_url: str | None = None
    is_guest: bool
    is_active: bool

    model_config = {
        "from_attributes": True
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
        "from_attributes": True
    }


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GoogleLogin(BaseModel):
    credential: str
