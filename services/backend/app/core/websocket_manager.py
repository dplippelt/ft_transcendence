import asyncio
import logging

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

    async def send_to_user(self, user_id: int, payload: dict) -> None:
        # Catch broadly per-socket: one dead/broken connection must not stop
        # delivery to this user's other open tabs/devices. A timeout guards
        # against a socket that accepts the connection but stalls on reading
        # (never raises, just hangs) -- sends are sequential here, so one
        # stuck socket would otherwise delay every send after it, including
        # the REST response that triggered this call.
        for websocket in list(self.active_connections.get(user_id, [])):
            try:
                await asyncio.wait_for(websocket.send_json(payload), timeout=SEND_TIMEOUT_SECONDS)
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

    def notify(self, user_id: int, payload: dict) -> None:
        # Sync-callable, best-effort wrapper for use from non-async route
        # handlers: bridges to the event loop and never raises, so a
        # delivery failure here can't turn an already-successful action
        # (the caller already persisted whatever this is announcing) into
        # a 500 for the request that triggered it.
        try:
            anyio.from_thread.run(self.send_to_user, user_id, payload)
        except Exception:
            logger.warning("Failed to notify user %s over websocket", user_id, exc_info=True)


connection_manager = ConnectionManager()
