from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    username: str | None = Field(default=None, min_length=3, max_length=50)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


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


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GoogleLogin(BaseModel):
    credential: str
