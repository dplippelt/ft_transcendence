import asyncio
import logging
from collections.abc import Awaitable, Callable

import anyio.from_thread
from fastapi import WebSocket

from app.services.presence_service import notify_friend_presence_change

logger = logging.getLogger(__name__)

SEND_TIMEOUT_SECONDS = 5


class ConnectionManager:
    # In-process only: connections live in this worker's memory, so a user
    # connected to a different worker/instance won't receive a push sent
    # from here. Fine for a single-process deployment; a multi-worker or
    # multi-instance setup would need a shared pub/sub layer (e.g. Redis)
    # instead.
    def __init__(self, on_presence_changed: Callable[["ConnectionManager", int], Awaitable[None]] | None = None,) -> None:
        self.active_connections: dict[int, list[WebSocket]] = {}
        self._on_presence_changed = on_presence_changed
        self._presence_tasks: set[asyncio.Task] = set()

    def _presence_changed(self, user_id: int) -> None:
        # Schedule best-effort notifications on the connection's event loop.
        # They must not block the handshake, disconnect cleanup or chat sends.
        if self._on_presence_changed is None:
            return
        # Instead of waiting for all friends to receive the notification, schedule it as a background async task.
        task = asyncio.create_task(self._notify_presence_changed(user_id))
        # Maintain references to running tasks until they finish.
        self._presence_tasks.add(task)
        task.add_done_callback(self._presence_tasks.discard)

    async def _notify_presence_changed(self, user_id: int) -> None:
        try:
            if self._on_presence_changed is not None:
                await self._on_presence_changed(self, user_id)
        except Exception:
            logger.warning("Failed to notify friends of presence change for user %s", user_id, exc_info=True)

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        was_online = self.is_online(user_id)
        self.active_connections.setdefault(user_id, []).append(websocket)

        if not was_online:
            self._presence_changed(user_id)

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        connections = self.active_connections.get(user_id)

        if not connections or websocket not in connections:
            return

        connections.remove(websocket)

        if not connections:
            _ = self.active_connections.pop(user_id, None)
            self._presence_changed(user_id)

    def is_online(self, user_id: int) -> bool:
        # One active authenticated chat connection is enough. Other tabs
        # can disconnect without marking the user offline.
        return bool(self.active_connections.get(user_id))

    async def send_to_user(self, user_id: int, payload: dict) -> bool:
        # Catch broadly per-socket: one dead/broken connection must not stop
        # delivery to this user's other open tabs/devices. A timeout guards
        # against a socket that accepts the connection but stalls on reading
        # (never raises, just hangs) -- sends are sequential here, so one
        # stuck socket would otherwise delay every send after it, including
        # the REST response that triggered this call.
        # Returns whether the payload reached at least one connection, so a
        # caller can tell "nobody was listening" apart from "delivered".
        delivered = False

        for websocket in list(self.active_connections.get(user_id, [])):
            try:
                await asyncio.wait_for(websocket.send_json(payload), timeout=SEND_TIMEOUT_SECONDS)
                delivered = True
            except Exception:
                logger.warning("Failed to push message to user %s over websocket", user_id, exc_info=True)

                # Unregister before closing: a concurrent send_to_user call
                # for this user must not be able to pick this socket while
                # we're still in the middle of tearing it down.
                self.disconnect(user_id, websocket)

                try:
                    await asyncio.wait_for(websocket.close(), timeout=SEND_TIMEOUT_SECONDS)
                except Exception:
                    logger.debug(
                        "Failed to close websocket",
                        exc_info=True,
                    )

        return delivered

    async def send_to_all(self, payload: dict) -> None:
        user_ids = list(self.active_connections)
        await asyncio.gather(*(self.send_to_user(user_id, payload) for user_id in user_ids))

    def notify_all(self, payload: dict) -> None:
        try:
            anyio.from_thread.run(self.send_to_all, payload)
        except Exception:
            logger.warning("Failed to broadcast websocket message", exc_info=True)

    def notify(self, user_id: int, payload: dict) -> bool:
        # Sync-callable, best-effort wrapper for use from non-async route
        # handlers: bridges to the event loop and never raises, so a
        # delivery failure here can't turn an already-successful action
        # (the caller already persisted whatever this is announcing) into
        # a 500 for the request that triggered it.
        try:
            return anyio.from_thread.run(self.send_to_user, user_id, payload)
        except Exception:
            logger.warning("Failed to notify user %s over websocket", user_id, exc_info=True)
            return False

    def build_payload_safely(self, message_type: str, build_fields: Callable[[], dict]) -> dict | None:
        # Shared "tag a payload with a type, guard building it" step, split
        # out from notify_safely so a caller that fans one payload out to
        # multiple recipients can build it once instead of once per
        # recipient (see notify_other_members in lobbies.py).
        try:
            return {"type": message_type, **build_fields()}
        except Exception:
            logger.warning("Failed to prepare %s notification payload", message_type, exc_info=True)
            return None

    def notify_safely(self, user_id: int, message_type: str, build_fields: Callable[[], dict]) -> bool:
        # Shared wrapper for the common 1:1 "build a payload, guard it, then
        # notify one user" shape, so each caller isn't hand-rolling its own
        # try/except + logging.
        payload = self.build_payload_safely(message_type, build_fields)

        if payload is None:
            return False

        return self.notify(user_id, payload)


connection_manager = ConnectionManager(on_presence_changed=notify_friend_presence_change)
