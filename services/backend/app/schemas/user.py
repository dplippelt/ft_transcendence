from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
  username: str = Field(min_length=3, max_length=50)
  email: EmailStr | None = None

class UserRegister(UserBase):
  password: str = Field(min_length=8)

class UserLogin(BaseModel):
  username: str = Field(min_length=3, max_length=50)
  password: str = Field(min_length=8)

class UserResponse(UserBase):
  id: int
  is_guest: bool

  model_config = {
    "from_attributes": True
  }

class Token(BaseModel):
  access_token: str
  token_type: str = "bearer"
