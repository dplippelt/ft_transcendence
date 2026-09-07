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


class LobbyMessageCreate(BaseModel):
    content: str = Field(
        min_length=1,
        max_length=2000,
    )

    @model_validator(mode="before")
    @classmethod
    def strip_content(cls, data: Any) -> Any:
        if isinstance(data, dict) and isinstance(data.get("content"), str):
            data["content"] = data["content"].strip()

        return data


class LobbyMessageResponse(BaseModel):
    id: int
    lobby_id: int
    sender: PublicUserResponse
    content: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


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


class LobbyInviteCreate(BaseModel):
    friend_id: int = Field(gt=0)


class LobbyInviteResponse(BaseModel):
    # Whether the invite reached an active websocket connection on this
    # backend process specifically -- not a durable delivery receipt. A
    # friend connected to a different worker/instance in a multi-process
    # deployment would show False here despite being online elsewhere.
    delivered: bool


class LobbyGameResponse(BaseModel):
    game_session_id: str
