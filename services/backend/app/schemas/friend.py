from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field

from app.schemas.user import PublicUserResponse


class FriendRequestStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


# A small public user object for friend related responses, so that we don't
# expose sensitive user information -- same shape as PublicUserResponse.
FriendUserResponse = PublicUserResponse


# schemas for sending a friend request
class FriendRequestCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)


# schemas represents a pending or handled friend request
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


# schemas represents an actual confirmed friend in the user's friend list
class FriendResponse(BaseModel):
    id: int
    friend: FriendUserResponse
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


# schemas for returning a list of friends in the user's friend list
class FriendListResponse(BaseModel):
    friends: list[FriendResponse]
