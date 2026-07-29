from fastapi import APIRouter, status
from sqlalchemy import or_
from sqlalchemy.orm import joinedload

from app.api.dependencies import CurrentUser, DbSession
from app.core.exceptions import ErrorCode, not_found
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
    PENDING,
    accept_friend_request as accept_friend_request_service,
    cancel_friend_request as cancel_friend_request_service,
    reject_friend_request as reject_friend_request_service,
    remove_friend as remove_friend_service,
    send_friend_request,
)
from app.services.user_service import get_active_user_by_username

router = APIRouter()


def build_friend_response(friendship: Friendship, friend: User) -> FriendResponse:
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

    friend_ids = [
        friendship.user_b_id
        if friendship.user_a_id == current_user.id
        else friendship.user_a_id
        for friendship in friendships
    ]

    if not friend_ids:
        return FriendListResponse(friends=[])

    users = (
        db.query(User)
        .filter(
            User.id.in_(friend_ids),
            User.is_active.is_(True),
        )
        .all()
    )

    users_by_id = {
        user.id: user
        for user in users
    }

    friends: list[FriendResponse] = []

    for friendship in friendships:
        friend_id = (
            friendship.user_b_id
            if friendship.user_a_id == current_user.id
            else friendship.user_a_id
        )

        friend = users_by_id.get(friend_id)

        if friend is None:
            continue

        friends.append(
            build_friend_response(
                friendship,
                friend,
            )
        )

    return FriendListResponse(friends=friends)


@router.post("/requests", response_model=FriendRequestResponse)
def create_friend_request(request_data: FriendRequestCreate, current_user: CurrentUser, db: DbSession,):

    # Look up via the active-only helper (rather than checking is_active
    # separately) so a deactivated recipient reads as "not found" here too,
    # matching chat.py/users.py -- otherwise this endpoint would be the one
    # place that leaks whether a username belongs to a deactivated account.
    recipient = get_active_user_by_username(db, request_data.username)

    if recipient is None:
        raise not_found("User not found.", code=ErrorCode.USER_NOT_FOUND)

    return send_friend_request(
        db=db,
        current_user=current_user,
        recipient=recipient,
    )


@router.get("/requests/incoming", response_model=list[FriendRequestResponse])
def get_incoming_friend_requests(current_user: CurrentUser, db: DbSession):
    return (
        db.query(FriendRequest)
        .options(
            joinedload(FriendRequest.requester),
            joinedload(FriendRequest.recipient),
        )
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
        .options(
            joinedload(FriendRequest.requester),
            joinedload(FriendRequest.recipient),
        )
        .filter(
            FriendRequest.requester_id == current_user.id,
            FriendRequest.status == PENDING,
        )
        .all()
    )


@router.post("/requests/{request_id}/accept", response_model=FriendRequestResponse)
def accept_friend_request(request_id: int, current_user: CurrentUser, db: DbSession):

    return accept_friend_request_service(
        db=db,
        request_id=request_id,
        current_user=current_user,
    )


@router.post("/requests/{request_id}/reject", response_model=FriendRequestResponse)
def reject_friend_request(request_id: int, current_user: CurrentUser, db: DbSession,):

    return reject_friend_request_service(
        db=db,
        request_id=request_id,
        current_user=current_user,
    )


@router.delete("/{friend_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_friend(friend_id: int, current_user: CurrentUser, db: DbSession,):
    remove_friend_service(
        db=db,
        current_user=current_user,
        friend_id=friend_id,
    )

    return None


@router.delete("/requests/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_friend_request(request_id: int, current_user: CurrentUser, db: DbSession,):
    cancel_friend_request_service(
        db=db,
        request_id=request_id,
        current_user=current_user,
    )

    return None
