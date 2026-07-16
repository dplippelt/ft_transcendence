# implement these endpoints

# GET    /friends
# POST   /friends/requests
# GET    /friends/requests
# POST   /friends/requests/{request_id}/accept
# POST   /friends/requests/{request_id}/reject
# DELETE /friends/{friend_id}

# GET    /friends/{friend_id}/messages
# POST   /friends/{friend_id}/messages


from typing import Annotated
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import or_

from app.api.dependencies import CurrentUser, DbSession
from app.models.friend_request import FriendRequest
from app.models.friendship import Friendship
from app.models.user import User
from app.schemas.friend import (
    FriendListResponse,
    FriendRequestCreate,
    FriendRequestResponse,
    FriendResponse,
    FriendUserResponse,
)
from app.services.friend_service import (
    ACCEPTED,
    PENDING,
    REJECTED,
    normalize_friend_pair,
    send_friend_request,
)


router = APIRouter()


def get_user_by_username(db: DbSession, username: str) -> User | None:
    return (
        db.query(User)
        .filter(User.username == username)
        .first()
    )


def build_friend_response(friendship: Friendship, current_user: User, friend: User) -> FriendResponse:
    return FriendResponse(
        id=friendship.id,
        friend=FriendUserResponse.model_validate(friend),
        created_at=friendship.created_at,
    )


@router.get("", response_model=FriendListResponse)
def get_friends(current_user: CurrentUser, db: DbSession):
    friendships = (
        db.query(Friendship)
        .filter(
            or_(
                Friendship.user_a_id == current_user.id,
                Friendship.user_b_id == current_user.id,
            )
        )
        .all()
    )

    friends: list[FriendResponse] = []

    for friendship in friendships:
        friend_id = (
            friendship.user_b_id
            if friendship.user_a_id == current_user.id
            else friendship.user_a_id
        )

        friend = (
            db.query(User)
            .filter(User.id == friend_id)
            .first()
        )

        if friend is None or not friend.is_active:
            continue

        friends.append(
            build_friend_response(
                friendship,
                current_user,
                friend
            )
        )
    return FriendListResponse(friends=friends)


@router.post("/requests", response_model=FriendRequestResponse)
def create_friend_request(
    request_data: FriendRequestCreate,
    current_user: CurrentUser,
    db: DbSession,
)

    recipient = get_user_by_username(db, request_data.username)

    if recipient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if not recipient.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive.",
        )

    return send_friend_request(
        db=db,
        current_user=current_user,
        recipient=recipient,
    )


@router.get("/requests/incoming", response_model=list[FriendRequestResponse])
def get_incoming_friend_requests(current_user: CurrentUser, db: DbSession):
    return (
        db.query(FriendRequest)
        .filter(
            FriendRequest.recipient_id == current_user.id,
            FriendRequest.status == PENDING,
        )
        .all()
    )


@router.get("/requests/outgoing", response_model=list[FriendRequestResponse])
def get_outgoing_friend_requests(current_user: CurrentUser, db: DbSession):
    return (
        db.query(FriendRequest)
        .filter(
            FriendRequest.requester_id == current_user.id,
            FriendRequest.status == PENDING,
        )
        .all()
    )


@router.post("requests/{request_id}/accept", response_model=FriendRequestResponse)
def accept_friend_request(request_id: int, current_user: CurrentUser, db: DbSession):
    friend_request = (
        db.query(FriendRequest)
        .filter(FriendRequest.id == request_id,)
        .first()
    )

    if friend_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friend request not found.",
        )

    if friend_request.recipient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot accept this friend request.",
        )

    if friend_request.status != PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Friend request is not pending.",
        )

    user_a_id, user_b_id = normalize_friend_pair(
        friend_request.requester_id,
        friend_request.recipient_id,
    )

    existing_friendship = (
        db.query(Friendship)
        .filter(
            Friendship.user_a_id == user_a_id,
            Friendship.user_b_id == user_b_id,
        )
        .first()
    )

    if existing_friendship is None:
        friendship = Friendship(
            user_a_id=user_a_id,
            user_b_id=user_b_id,
        )
        db.add(friendship)

    friend_request.status = ACCEPTED
    friend_request.responded_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(friend_request)

    return friend_request

