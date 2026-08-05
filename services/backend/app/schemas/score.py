from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.user import PublicUserResponse


class ScoreCreate(BaseModel):
    dungeon_id: int
    value: int = Field(ge=0)


class ScoreResponse(BaseModel):
    id: int
    dungeon_id: int
    value: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class LeaderboardEntryResponse(BaseModel):
    user: PublicUserResponse
    value: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
