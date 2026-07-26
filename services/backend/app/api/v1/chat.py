import anyio.from_thread
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from app.api.dependencies import CurrentUser, CurrentUserWS, DbSession
from app.core.exceptions import bad_request, not_found
from app.core.websocket_manager import connection_manager
from app.models.user import User
from app.schemas.chat import ChatMessageCreate, ChatMessageResponse
from app.services.chat_service import (
    get_conversation,
    mark_conversation_as_read,
    send_message,
)

router = APIRouter()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )


@router.get("/{friend_id}/messages", response_model=list[ChatMessageResponse])
def get_messages(friend_id: int, current_user: CurrentUser, db: DbSession):
    return get_conversation(
        db=db,
        current_user=current_user,
        other_user_id=friend_id,
    )


@router.post("/{friend_id}/messages", response_model=ChatMessageResponse)
def create_message(friend_id: int, message_data: ChatMessageCreate, current_user: CurrentUser, db: DbSession):
    receiver = get_user_by_id(db, friend_id)

    if receiver is None:
        raise not_found("User not found.")

    if not receiver.is_active:
        raise bad_request("User account is inactive.")

    message = send_message(
        db=db,
        current_user=current_user,
        receiver=receiver,
        content=message_data.content,
    )

    # FastAPI runs sync path operations in a worker thread, so bridge back to
    # the event loop instead of awaiting the coroutine directly.
    anyio.from_thread.run(
        connection_manager.send_to_user,
        receiver.id,
        ChatMessageResponse.model_validate(message).model_dump(mode="json"),
    )

    return message


@router.post("/{friend_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_as_read(friend_id: int, current_user: CurrentUser, db: DbSession):
    mark_conversation_as_read(
        db=db,
        current_user=current_user,
        other_user_id=friend_id,
    )

    return None


@router.websocket("/ws")
async def chat_websocket(websocket: WebSocket, current_user: CurrentUserWS):
    await connection_manager.connect(current_user.id, websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connection_manager.disconnect(current_user.id, websocket)
