import logging

from app.core.access_logging import RedactAccessLogQueries, install_access_log_redaction


def make_record(template: str, args: tuple) -> logging.LogRecord:
    return logging.LogRecord("uvicorn.access", logging.INFO, __file__, 1, template, args, None)


def test_websocket_access_log_does_not_show_token():
    record = make_record('%s - "WebSocket %s" [accepted]', ("127.0.0.1:1234", "/chat/ws?token=MY_SECRET_JWT"))
    assert RedactAccessLogQueries().filter(record)

    message = record.getMessage()
    assert "MY_SECRET_JWT" not in message
    assert '/chat/ws?[REDACTED]' in message
    assert 'WebSocket' in message


def test_http_access_log_preserves_uvicorn_access_formatter_arguments():
    record = make_record('%s - "%s %s HTTP/%s" %d',
                         ("127.0.0.1:1234", "GET", "/users/me?token=MY_SECRET_JWT", "1.1", 200))
    assert RedactAccessLogQueries().filter(record)
    assert len(record.args) == 5
    assert record.args[-1] == 200
    assert "MY_SECRET_JWT" not in record.getMessage()
    assert 'GET /users/me?[REDACTED] HTTP/1.1' in record.getMessage()


def test_no_query_retains_path():
    record = make_record('%s - "WebSocket %s" [accepted]', ("127.0.0.1", "/chat/ws"))
    RedactAccessLogQueries().filter(record)
    assert '/chat/ws' in record.getMessage()
    assert '[REDACTED]' not in record.getMessage()


def test_installation_is_idempotent_on_http_and_websocket_loggers():
    loggers = [logging.getLogger(name) for name in ("uvicorn.access", "uvicorn.error")]
    existing = {logger: tuple(logger.filters) for logger in loggers}
    try:
        install_access_log_redaction()
        install_access_log_redaction()
        for logger in loggers:
            assert sum(isinstance(item, RedactAccessLogQueries) for item in logger.filters) == 1

        for result in ("[accepted]", "403"):
            record = logging.LogRecord(
                "uvicorn.error",
                logging.INFO,
                __file__,
                1,
                f'%s - "WebSocket %s" {result}',
                ("127.0.0.1:1234", "/chat/ws?token=MY_SECRET_JWT"),
                None,
            )
            # Exercise the logger's installed filters, not just Filter.filter().
            assert logging.getLogger("uvicorn.error").filter(record)
            assert "MY_SECRET_JWT" not in record.getMessage()
            assert "/chat/ws?[REDACTED]" in record.getMessage()
    finally:
        for logger in loggers:
            for item in tuple(logger.filters):
                if item not in existing[logger]:
                    logger.removeFilter(item)
