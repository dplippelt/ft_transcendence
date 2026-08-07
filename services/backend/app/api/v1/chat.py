import logging

import anyio.from_thread
from fastapi import APIRouter, WebSocket, status

from app.api.dependencies import CompletedUser, CurrentUserIdWS, DbSession
from app.core.exceptions import not_found
from app.core.websocket_manager import connection_manager
from app.schemas.chat import ChatMessageCreate, ChatMessageResponse
from app.services.chat_service import (
    get_conversation,
    mark_conversation_as_read,
    send_message,
)
from app.services.user_service import get_active_user_by_id

logger = logging.getLogger(__name__)

router = APIRouter()


def notify_receiver(receiver_id: int, message: object) -> None:
    # Best-effort: the message is already persisted, so a delivery failure
    # here (e.g. a dead connection anyio couldn't clean up in time) must not
    # turn a successful send into a 500.
    try:
        anyio.from_thread.run(
            connection_manager.send_to_user,
            receiver_id,
            ChatMessageResponse.model_validate(message).model_dump(mode="json"),
        )
    except Exception:
        logger.warning("Failed to notify user %s of new message", receiver_id, exc_info=True)


@router.get("/{friend_id}/messages", response_model=list[ChatMessageResponse])
def get_messages(friend_id: int, current_user: CompletedUser, db: DbSession):
    return get_conversation(
        db=db,
        current_user=current_user,
        other_user_id=friend_id,
    )


@router.post("/{friend_id}/messages", response_model=ChatMessageResponse)
def create_message(friend_id: int, message_data: ChatMessageCreate, current_user: CompletedUser, db: DbSession):
    receiver = get_active_user_by_id(db, friend_id)

    if receiver is None:
        raise not_found("User not found.")

    message = send_message(
        db=db,
        current_user=current_user,
        receiver=receiver,
        content=message_data.content,
    )

    notify_receiver(receiver.id, message)

    return message


@router.post("/{friend_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_as_read(friend_id: int, current_user: CompletedUser, db: DbSession):
    mark_conversation_as_read(
        db=db,
        current_user=current_user,
        other_user_id=friend_id,
    )

    return None


@router.websocket("/ws")
async def chat_websocket(websocket: WebSocket, current_user_id: CurrentUserIdWS):
    await connection_manager.connect(current_user_id, websocket)

    # receive() (not receive_text()) accepts any frame type without raising,
    # and cleanup runs in `finally` so it happens regardless of *how* the
    # loop exits (clean disconnect, unexpected frame, cancellation, etc.) --
    # not just on WebSocketDisconnect.
    try:
        while True:
            message = await websocket.receive()

            if message["type"] == "websocket.disconnect":
                break
    finally:
        connection_manager.disconnect(current_user_id, websocket)
