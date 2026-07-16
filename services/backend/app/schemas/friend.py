from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class FriendRequestStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


# It is a small public user object for friend related responses, so that we don't expose sensitive user information
class FriendUserResponse(BaseModel):
    id: int
    username: str | None = None
    display_name: str | None = None
    avatar_url: str | None = None

    model_config = {
        "from_attributes": True
    }


# schemas for sending a friend request
class FriendRequestCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)


# schemas respresents a pending or handled friend request
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


# schemas respresents an actual confirmed friend in the user's friend list
class FriendResponse(BaseModel):
    id: int
    friend: FriendUserResponse
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


# schemas for returns a list of friends in the user's friend list
class FriendListResponse(BaseModel):
    friends: list[FriendResponse]
