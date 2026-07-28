from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.exceptions import bad_request, forbidden, not_found

from app.models.friend_request import FriendRequest
from app.models.friendship import Friendship
from app.models.user import User


PENDING = "pending"
ACCEPTED = "accepted"
REJECTED = "rejected"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def commit_or_bad_request(db: Session, detail: str) -> None:
    # Used for writes that may hit DB uniqueness constraints.
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise bad_request(detail)


def normalize_friend_pair(user_a_id: int, user_b_id: int,) -> tuple[int, int]:
    return (min(user_a_id, user_b_id), max(user_a_id, user_b_id),)


def get_existing_friend_request(db: Session, user_a_id: int, user_b_id: int,) -> FriendRequest | None:
    pair_user_a_id, pair_user_b_id = normalize_friend_pair(
        user_a_id,
        user_b_id,
    )

    return (
        db.query(FriendRequest)
        .filter(
            FriendRequest.pair_user_a_id == pair_user_a_id,
            FriendRequest.pair_user_b_id == pair_user_b_id,
        )
        .first()
    )


def handle_existing_friend_request(db: Session, existing_request: FriendRequest, current_user: User, recipient: User,) -> FriendRequest:
    if existing_request.status == ACCEPTED:
        raise bad_request("Users are already friends.")

    if existing_request.status == PENDING:
        if existing_request.recipient_id == current_user.id:
            return accept_pending_friend_request(db, existing_request)

        raise bad_request("Friend request already sent.")

    if existing_request.status == REJECTED:
        pair_user_a_id, pair_user_b_id = normalize_friend_pair(
            current_user.id,
            recipient.id,
        )

        existing_request.requester_id = current_user.id
        existing_request.recipient_id = recipient.id
        existing_request.pair_user_a_id = pair_user_a_id
        existing_request.pair_user_b_id = pair_user_b_id
        existing_request.status = PENDING
        existing_request.responded_at = None

        commit_or_bad_request(
            db,
            "Friend request could not be sent.",
        )

        db.refresh(existing_request)

        return existing_request

    raise bad_request("Invalid friend request state.")


def get_friendship(db: Session, user_a_id: int, user_b_id: int,) -> Friendship | None:
    normalized_a_id, normalized_b_id = normalize_friend_pair(user_a_id, user_b_id,)

    return (
        db.query(Friendship)
        .filter(
            Friendship.user_a_id == normalized_a_id,
            Friendship.user_b_id == normalized_b_id,
        )
        .first()
    )


def create_friendship(db: Session, user_a_id: int, user_b_id: int,) -> Friendship:
    normalized_a_id, normalized_b_id = normalize_friend_pair(user_a_id, user_b_id,)

    friendship = Friendship(user_a_id=normalized_a_id, user_b_id=normalized_b_id,)

    db.add(friendship)

    return friendship


def get_or_create_friendship(db: Session, user_a_id: int, user_b_id: int,) -> Friendship:
    existing_friendship = get_friendship(db, user_a_id, user_b_id,)

    if existing_friendship:
        return existing_friendship

    return create_friendship(db, user_a_id, user_b_id,)


def require_pending_received_request(db: Session, request_id: int, current_user_id: int, action: str,) -> FriendRequest:
    friend_request = (
        db.query(FriendRequest)
        .filter(FriendRequest.id == request_id)
        .first()
    )

    if friend_request is None:
        raise not_found("Friend request not found.")

    if friend_request.recipient_id != current_user_id:
        raise forbidden(f"You cannot {action} this friend request.")

    if friend_request.status != PENDING:
        raise bad_request("Friend request is not pending.")

    return friend_request


def accept_pending_friend_request(db: Session, friend_request: FriendRequest,) -> FriendRequest:
    friend_request.status = ACCEPTED
    friend_request.responded_at = utc_now()

    get_or_create_friendship(
        db,
        friend_request.requester_id,
        friend_request.recipient_id,
    )

    commit_or_bad_request(
        db,
        "Friend request could not be accepted.",
    )

    db.refresh(friend_request)

    return friend_request


def send_friend_request(db: Session, current_user: User, recipient: User,) -> FriendRequest:
    if recipient.id == current_user.id:
        raise bad_request("You cannot send a friend request to yourself.")

    if get_friendship(db, current_user.id, recipient.id):
        raise bad_request("Users are already friends.")

    existing_request = get_existing_friend_request(
        db,
        current_user.id,
        recipient.id,
    )

    if existing_request:
        return handle_existing_friend_request(
            db=db,
            existing_request=existing_request,
            current_user=current_user,
            recipient=recipient,
        )

    pair_user_a_id, pair_user_b_id = normalize_friend_pair(
        current_user.id,
        recipient.id,
    )

    friend_request = FriendRequest(
        requester_id=current_user.id,
        recipient_id=recipient.id,
        pair_user_a_id=pair_user_a_id,
        pair_user_b_id=pair_user_b_id,
        status=PENDING,
    )

    db.add(friend_request)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        existing_request = get_existing_friend_request(
            db,
            current_user.id,
            recipient.id,
        )

        if existing_request:
            return handle_existing_friend_request(
                db=db,
                existing_request=existing_request,
                current_user=current_user,
                recipient=recipient,
            )

        raise bad_request("Friend request already exists.")

    db.refresh(friend_request)

    return friend_request


def accept_friend_request(db: Session, request_id: int,current_user: User,) -> FriendRequest:
    friend_request = require_pending_received_request(
        db,
        request_id,
        current_user.id,
        "accept",
    )

    return accept_pending_friend_request(
        db,
        friend_request,
    )


def reject_friend_request(db: Session, request_id: int, current_user: User,) -> FriendRequest:
    friend_request = require_pending_received_request(
        db,
        request_id,
        current_user.id,
        "reject",
    )

    friend_request.status = REJECTED
    friend_request.responded_at = utc_now()

    db.commit()
    db.refresh(friend_request)

    return friend_request


def cancel_friend_request(db: Session, request_id: int, current_user: User,) -> None:
    friend_request = (
        db.query(FriendRequest)
        .filter(FriendRequest.id == request_id)
        .first()
    )

    if friend_request is None:
        raise not_found("Friend request not found.")

    if friend_request.requester_id != current_user.id:
        raise forbidden("You cannot cancel this friend request.")

    if friend_request.status != PENDING:
        raise bad_request("Friend request is not pending.")

    db.delete(friend_request)
    db.commit()


def remove_friend(db: Session, current_user: User, friend_id: int) -> None:
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
