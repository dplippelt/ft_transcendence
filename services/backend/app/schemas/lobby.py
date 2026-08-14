from datetime import datetime

from pydantic import BaseModel

from app.schemas.user import PublicUserResponse


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
