from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.user import PublicUserResponse

MAX_SCORE_VALUE = 2_147_483_647  # Postgres int4 upper bound


class ScoreCreate(BaseModel):
    dungeon_id: int
    value: int = Field(ge=0, le=MAX_SCORE_VALUE)


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
    dungeon_id: int
    value: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
