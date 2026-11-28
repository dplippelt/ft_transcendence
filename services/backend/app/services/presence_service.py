from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING

import anyio
from sqlalchemy import or_

from app.db.database import SessionLocal
from app.models.friendship import Friendship

if TYPE_CHECKING:
    from app.core.websocket_manager import ConnectionManager


def get_friend_ids(user_id: int) -> set[int]:
    # Use a fresh, short-lived session per transition. A WebSocket should
    # never keep a database session open for its entire lifetime.
    with SessionLocal() as db:
        friendships = (
            db.query(Friendship.user_a_id, Friendship.user_b_id)
            .filter(
                or_(
                    Friendship.user_a_id == user_id,
                    Friendship.user_b_id == user_id,
                )
            )
            .all()
        )

        return {
            user_b_id if user_a_id == user_id else user_a_id
            for user_a_id, user_b_id in friendships
        }


async def notify_friend_presence_change(manager: ConnectionManager, user_id: int) -> None:
    # The DB query is synchronous, so run it off the WebSocket event loop.
    friend_ids = await anyio.to_thread.run_sync(get_friend_ids, user_id)

    # Invalidation rather than a status snapshot: clients reload the
    # authoritative state, even if connections change again during delivery.
    payload = {"type": "friend_presence_changed"}
    await asyncio.gather(*(manager.send_to_user(friend_id, payload) for friend_id in friend_ids))
