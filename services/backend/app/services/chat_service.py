from datetime import datetime, timezone

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.core.exceptions import bad_request, forbidden
from app.models.chat_message import ChatMessage
from app.models.user import User
from app.services.friend_service import get_friendship


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def require_friendship(db: Session, user_a_id: int, user_b_id: int) -> None:
    if get_friendship(db, user_a_id, user_b_id) is None:
        raise forbidden("You can only message your friends.")


def send_message(db: Session, current_user: User, receiver: User, content: str) -> ChatMessage:
    if receiver.id == current_user.id:
        raise bad_request("You cannot send a message to yourself.")

    require_friendship(db, current_user.id, receiver.id)

    message = ChatMessage(
        sender_id=current_user.id,
        receiver_id=receiver.id,
        content=content,
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return message


def get_conversation(db: Session, current_user: User, other_user_id: int) -> list[ChatMessage]:
    require_friendship(db, current_user.id, other_user_id)

    return (
        db.query(ChatMessage)
        .filter(
            or_(
                and_(
                    ChatMessage.sender_id == current_user.id,
                    ChatMessage.receiver_id == other_user_id,
                ),
                and_(
                    ChatMessage.sender_id == other_user_id,
                    ChatMessage.receiver_id == current_user.id,
                ),
            )
        )
        .order_by(ChatMessage.created_at)
        .all()
    )


def mark_conversation_as_read(db: Session, current_user: User, other_user_id: int) -> None:
    require_friendship(db, current_user.id, other_user_id)

    (
        db.query(ChatMessage)
        .filter(
            ChatMessage.sender_id == other_user_id,
            ChatMessage.receiver_id == current_user.id,
            ChatMessage.read_at.is_(None),
        )
        .update({"read_at": utc_now()})
    )

    db.commit()
