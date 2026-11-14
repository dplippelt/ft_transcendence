import logging
import re

# URL paths with a query string, in raw or already-formatted access records.
# This also protects future routes that pass other credentials in URLs.
_QUERY_STRING = re.compile(r"(?P<path>/[^\s\"'?]*)\?[^\s\"']+")


def _redact_query(value: str) -> str:
    return _QUERY_STRING.sub(r"\g<path>?[REDACTED]", value)


class RedactAccessLogQueries(logging.Filter):
    """Preserve Uvicorn's argument structure (needed by AccessFormatter)."""

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = _redact_query(record.msg)

        if isinstance(record.args, tuple):
            record.args = tuple(
                _redact_query(value) if isinstance(value, str) else value
                for value in record.args
            )
        elif isinstance(record.args, dict):
            record.args = {
                key: _redact_query(value) if isinstance(value, str) else value
                for key, value in record.args.items()
            }
        return True


def install_access_log_redaction() -> None:
    """Protect both Uvicorn HTTP access logs and WebSocket handshake logs."""
    # Uvicorn writes HTTP request lines to uvicorn.access, but WebSocket
    # accepted/rejected messages (including the request URL) to uvicorn.error.
    for name in ("uvicorn.access", "uvicorn.error"):
        logger = logging.getLogger(name)
        if not any(isinstance(item, RedactAccessLogQueries) for item in logger.filters):
            logger.addFilter(RedactAccessLogQueries())
