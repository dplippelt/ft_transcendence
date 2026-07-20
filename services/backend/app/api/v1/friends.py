from fastapi import APIRouter, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.api.dependencies import CurrentUser, DbSession
from app.core.exceptions import bad_request, not_found
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

router = APIRouter()


def get_user_by_username(db: Session, username: str) -> User | None:
    return (
        db.query(User)
        .filter(User.username == username)
        .first()
    )


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

    recipient = get_user_by_username(db, request_data.username)

    if recipient is None:
        raise not_found("User not found.",)

    if not recipient.is_active:
        raise bad_request("User account is inactive.",)

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
def remove_friend(friend_id: int, current_user: CurrentUser, db: DbSession):

    if friend_id == current_user.id:
        raise bad_request("You cannot remove yourself as a friend.")

    friendship = get_friendship(
        db,
        current_user.id,
        friend_id,
    )

    if friendship is None:
        raise not_found("Friendship not found.")

    existing_request = get_existing_friend_request(
        db,
        current_user.id,
        friend_id,
    )

    db.delete(friendship)

    if existing_request:
        db.delete(existing_request)

    db.commit()

@router.delete("/requests/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_friend_request(request_id: int, current_user: CurrentUser, db: DbSession,):
    cancel_friend_request_service(
        db=db,
        request_id=request_id,
        current_user=current_user,
    )

    return None
