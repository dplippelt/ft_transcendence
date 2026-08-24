import asyncio
import logging
from collections.abc import Callable

import anyio.from_thread
from fastapi import WebSocket

logger = logging.getLogger(__name__)

SEND_TIMEOUT_SECONDS = 5


class ConnectionManager:
    # In-process only: connections live in this worker's memory, so a user
    # connected to a different worker/instance won't receive a push sent
    # from here. Fine for a single-process deployment; a multi-worker or
    # multi-instance setup would need a shared pub/sub layer (e.g. Redis)
    # instead.
    def __init__(self) -> None:
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.setdefault(user_id, []).append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        connections = self.active_connections.get(user_id)

        if not connections:
            return

        if websocket in connections:
            connections.remove(websocket)

        if not connections:
            self.active_connections.pop(user_id, None)

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
                    await websocket.close()
                except Exception:
                    pass

        return delivered

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


connection_manager = ConnectionManager()
