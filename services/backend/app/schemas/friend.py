from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class FriendRequestStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class FriendUserResponse(BaseModel):
    id: int
    username: str | None = None
    display_name: str | None = None
    avatar_url: str | None = None

    model_config = {
        "from_attributes": True
    }


class FriendRequestCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)


class FriendRequestResponse(BaseModel):
    id: int
    requester: FriendUserResponse
    recipient: FriendUserResponse
    status: FriendRequestStatus
    created_at: datetime
    responded_at: datetime | None = None

    model_config = {
        "from_attributes": True
    }


class FriendResponse(BaseModel):
    id: int
    friend: FriendUserResponse
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class FriendListResponse(BaseModel):
    friends: list[FriendResponse]
