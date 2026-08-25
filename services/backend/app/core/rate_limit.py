import threading
from collections.abc import Hashable
from datetime import datetime, timedelta, timezone


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


# How many allow() calls between opportunistic cleanups of expired keys.
# Amortizes the cleanup cost instead of paying for a full-dict scan on
# every single call -- see the class docstring for why every call doesn't
# need it.
_CLEANUP_INTERVAL = 1000


class SlidingWindowLimiter:
    # Fixed-window counter, not a true sliding window: each key just tracks
    # (count, window_start), and the window resets the moment it's checked
    # after expiring. The two callers this was built for (login/
    # registration attempt throttling) only need a rough "how many attempts
    # in about the last minute" count, not per-hit timestamps or precise
    # sliding-window fairness -- the classic fixed-window edge case (two
    # bursts of max_count right around a window boundary) doesn't matter
    # for a brute-force throttle at these thresholds. That means allow()
    # never needs to scan every OTHER key on every call the way a
    # timestamp-list sliding window does: each key's own entry self-expires
    # the moment it's next checked, so cleanup only has to run occasionally
    # (every _CLEANUP_INTERVAL calls) to reclaim keys nobody has revisited,
    # not on every single request.
    #
    # In-process only, same tradeoff as every other in-process spam guard
    # in this codebase (see websocket_manager.ConnectionManager,
    # lobby_service's invite cooldown): state is lost on restart and not
    # shared across worker processes, so this is a best-effort throttle,
    # not a source of truth. Fine for a single-process deployment; would
    # need a shared store (e.g. Redis) to hold under multiple
    # workers/instances -- worth revisiting before this ever backs a
    # multi-worker deployment, since unlike a UX spam guard, a weakened
    # brute-force limiter is a security-relevant regression, not just UX.
    def __init__(self, window: timedelta, max_count: int) -> None:
        self._window = window
        self._max_count = max_count
        self._counts: dict[Hashable, tuple[int, datetime]] = {}
        self._lock = threading.Lock()
        self._calls_since_cleanup = 0

    def allow(self, key: Hashable) -> bool:
        # Records the attempt regardless of the caller's outcome -- unlike
        # the lobby invite limiter, callers here (login/registration
        # attempts) want *every* attempt, successful or not, to count
        # against the budget, so there's no matching release().
        with self._lock:
            now = _utc_now()
            count, window_start = self._counts.get(key, (0, now))

            if now - window_start >= self._window:
                count, window_start = 0, now

            if count >= self._max_count:
                return False

            self._counts[key] = (count + 1, window_start)

            self._calls_since_cleanup += 1

            if self._calls_since_cleanup >= _CLEANUP_INTERVAL:
                self._calls_since_cleanup = 0
                cutoff = now - self._window

                for stale_key, (_, stale_window_start) in list(self._counts.items()):
                    if stale_window_start < cutoff:
                        self._counts.pop(stale_key, None)

            return True
