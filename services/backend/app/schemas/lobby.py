from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, model_validator

from app.schemas.user import PublicUserResponse

LOBBY_NAME_PATTERN = r"^[ a-zA-Z0-9_.-]+$"


class LobbyCreate(BaseModel):
    name: str = Field(
        min_length=3,
        max_length=50,
        pattern=LOBBY_NAME_PATTERN,
    )

    @model_validator(mode="before")
    @classmethod
    def strip_name(cls, data: Any) -> Any:
        if isinstance(data, dict) and isinstance(data.get("name"), str):
            data["name"] = data["name"].strip()

        return data


class LobbyMemberResponse(BaseModel):
    user: PublicUserResponse
    role: str
    joined_at: datetime

    model_config = {
        "from_attributes": True
    }


class LobbyResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    members: list[LobbyMemberResponse]

    model_config = {
        "from_attributes": True
    }
