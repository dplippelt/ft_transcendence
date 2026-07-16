from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import and_, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.friend_request import FriendRequest
from app.models.user import User


PENDING = "pending"
ACCEPTED = "accepted"
REJECTED = "rejected"


def normalize_friend_pair(user_a_id:int, user_b_id:int) -> tuple[int, int]:
    return (
        min(user_a_id, user_b_id),
        max(user_a_id, user_b_id),
    )


def get_existing_friend_request(db: Session, user_a_id: int, user_b_id: int,) -> FriendRequest | None:
    return (
        db.query(FriendRequest)
        .filter(
            or_(
                and_(
                    FriendRequest.requester_id == user_a_id,
                    FriendRequest.recipient_id == user_b_id,
                ),
                and_(
                    FriendRequest.requester_id == user_b_id,
                    FriendRequest.recipient_id == user_a_id,
                ),
            )
        )
        .first()
    )


def send_friend_request(db: Session, current_user: User, recipient: User,) -> FriendRequest:
    if recipient.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot send a friend request to yourself.",
        )

    if existing_request:
        if existing_request.status == ACCEPTED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Users are already friends",
            )

    if existing_request.status == PENDING:
        if existing_request.requester_id == current_user.id:
            # Reverse pending request exists:
            # A sent request to B, and now B sends request to A.
            # Treat this as auto-accept.
            existing_request.status = ACCEPTED
            existing_request.responded_at = datetime.now(timezone.utc)

            # Todo: Add logic to create a friendship record in the database

            try:
                db.commit()
            except IntegrityError:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Friend request could not be accepted",
                )

            db.refresh(existing_request)

            return existing_request
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A pending friend request already exists.",
        )

    if existing_request.status == REJECTED:
        # Allow sending again after rejection.
        requester_id = current_user.id
        recipient_id = recipient.id
        existing_request.status = PENDING
        existing_request.responded_at = None

        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Friend request could not be sent",
            )
        db.refresh(existing_request)
        return existing_request

    friend_request = FriendRequest(
        requester_id=current_user.id,
        recipient_id=recipient.id,
        status=PENDING,
    )

    db.add(friend_request)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Friend request already exists",
        )

    db.refresh(friend_request)
    return friend_request
