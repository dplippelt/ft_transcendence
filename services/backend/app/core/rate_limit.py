import threading
from collections.abc import Hashable
from datetime import datetime, timedelta, timezone


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SlidingWindowLimiter:
    # In-process, per-key sliding-window request limiter. Same tradeoff as
    # every other in-process spam guard in this codebase (see
    # websocket_manager.ConnectionManager, lobby_service's invite cooldown):
    # state is lost on restart and not shared across worker processes, so
    # this is a best-effort throttle, not a source of truth. Fine for a
    # single-process deployment; would need a shared store (e.g. Redis) to
    # hold under multiple workers/instances.
    def __init__(self, window: timedelta, max_count: int) -> None:
        self._window = window
        self._max_count = max_count
        self._hits: dict[Hashable, list[datetime]] = {}
        self._lock = threading.Lock()

    def allow(self, key: Hashable) -> bool:
        # Records the attempt regardless of the caller's outcome -- unlike
        # the lobby invite limiter, callers here (login/registration
        # attempts) want *every* attempt, successful or not, to count
        # against the budget, so there's no matching release().
        with self._lock:
            now = _utc_now()
            cutoff = now - self._window

            # Opportunistic cleanup across *all* keys, not just this one,
            # so an inactive key's stale entries don't linger until it
            # happens to be visited again.
            for stale_key, hits in list(self._hits.items()):
                while hits and hits[0] < cutoff:
                    hits.pop(0)

                if not hits:
                    self._hits.pop(stale_key, None)

            hits = self._hits.setdefault(key, [])

            if len(hits) >= self._max_count:
                return False

            hits.append(now)

            return True
