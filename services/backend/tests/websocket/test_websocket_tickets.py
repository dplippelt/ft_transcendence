from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import update
from sqlalchemy.orm import sessionmaker
from starlette.websockets import WebSocketDisconnect

from app.api import dependencies
from app.api.v1 import chat
from app.core.security import decode_token
from app.core.settings import get_settings
from app.core.websocket_manager import connection_manager
from app.models.websocket_ticket import WebSocketTicket


@pytest.fixture()
def ws_client(app, db, monkeypatch):
    # The shared test app includes auth routes but not chat routes.
    app.include_router(chat.router, prefix="/chat")

    # WS authentication deliberately opens its own short-lived session,
    # rather than using get_db. Give it the test database, not the real DB.
    monkeypatch.setattr(
        dependencies,
        "SessionLocal",
        sessionmaker(bind=db.get_bind()),
    )
    connection_manager.active_connections.clear()

    with TestClient(app) as client:
        yield client

    connection_manager.active_connections.clear()


def _get_ticket(client: TestClient, auth_headers: dict) -> str:
    response = client.post("/auth/ws-ticket", headers=auth_headers)
    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    assert response.json()["expires_in"] == 30
    return response.json()["ticket"]


def _connect(client: TestClient, ticket: str, *, origin: str | None = None):
    if origin is None:
        origin = get_settings().frontend_origin
    return client.websocket_connect(
        f"/chat/ws?ticket={ticket}",
        headers={"Origin": origin},
    )


def test_requires_access_token_to_issue_ticket(ws_client):
    response = ws_client.post("/auth/ws-ticket")
    assert response.status_code == 401


def test_issues_short_lived_ticket_without_storing_plaintext(ws_client, user, auth_headers, db):
    ticket = _get_ticket(ws_client, auth_headers)
    record = db.query(WebSocketTicket).one()

    assert len(ticket) >= 40
    assert ticket != record.ticket_hash
    assert ticket not in str(record.__dict__)
    assert record.user_id == user.id
    assert decode_token(ticket) is None


def test_ticket_connects_then_cannot_be_replayed(ws_client, user, auth_headers):
    ticket = _get_ticket(ws_client, auth_headers)

    with _connect(ws_client, ticket):
        assert len(connection_manager.active_connections[user.id]) == 1
        with pytest.raises(WebSocketDisconnect), _connect(ws_client, ticket):
            pass

    assert user.id not in connection_manager.active_connections
    with pytest.raises(WebSocketDisconnect), _connect(ws_client, ticket):
        pass


def test_two_independently_issued_tickets_work_for_two_tabs(ws_client, user, auth_headers):
    ticket_a = _get_ticket(ws_client, auth_headers)
    ticket_b = _get_ticket(ws_client, auth_headers)

    assert ticket_a != ticket_b
    with _connect(ws_client, ticket_a), _connect(ws_client, ticket_b):
        assert len(connection_manager.active_connections[user.id]) == 2

    assert user.id not in connection_manager.active_connections


def test_expired_ticket_is_rejected(ws_client, db, auth_headers):
    ticket = _get_ticket(ws_client, auth_headers)
    db.execute(
        update(WebSocketTicket).values(
            expires_at=datetime.now(UTC) - timedelta(seconds=1)
        )
    )
    db.commit()

    with pytest.raises(WebSocketDisconnect), _connect(ws_client, ticket):
        pass


def test_unknown_ticket_is_rejected(ws_client):
    with pytest.raises(WebSocketDisconnect), _connect(ws_client, "invalid-ticket"):
        pass


def test_rejected_origin_does_not_consume_ticket(ws_client, auth_headers, user):
    ticket = _get_ticket(ws_client, auth_headers)

    with (
        pytest.raises(WebSocketDisconnect),
        _connect(ws_client, ticket, origin="https://untrusted.example"),
    ):
        pass

    with _connect(ws_client, ticket):
        assert user.id in connection_manager.active_connections


def test_inactive_user_cannot_redeem_existing_ticket(ws_client, user, db, auth_headers):
    ticket = _get_ticket(ws_client, auth_headers)
    user.is_active = False
    db.commit()

    with pytest.raises(WebSocketDisconnect), _connect(ws_client, ticket):
        pass


def test_username_is_required_to_issue_ticket(ws_client, user, db, auth_headers):
    user.username = None
    db.commit()

    response = ws_client.post("/auth/ws-ticket", headers=auth_headers)
    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "USERNAME_REQUIRED"


def test_invalid_ticket_never_falls_back_to_valid_access_token(ws_client, auth_headers):
    token = auth_headers["Authorization"].split(" ", 1)[1]

    with pytest.raises(WebSocketDisconnect), ws_client.websocket_connect(
        f"/chat/ws?ticket=bad-ticket&token={token}",
        headers={"Origin": get_settings().frontend_origin},
    ):
        pass


def test_legacy_jwt_url_is_rejected(ws_client, user, auth_headers):
    token = auth_headers["Authorization"].split(" ", 1)[1]

    with pytest.raises(WebSocketDisconnect) as exc, ws_client.websocket_connect(
        f"/chat/ws?token={token}",
        headers={"Origin": get_settings().frontend_origin},
    ):
        pass

    assert exc.value.code == 1008
    assert user.id not in connection_manager.active_connections


def test_missing_ticket_is_rejected(ws_client):
    with pytest.raises(WebSocketDisconnect) as exc, ws_client.websocket_connect(
        "/chat/ws",
        headers={"Origin": get_settings().frontend_origin},
    ):
        pass

    assert exc.value.code == 1008


def test_missing_origin_does_not_consume_ticket(ws_client, user, auth_headers):
    ticket = _get_ticket(ws_client, auth_headers)

    with pytest.raises(WebSocketDisconnect) as exc, ws_client.websocket_connect(
        f"/chat/ws?ticket={ticket}",
    ):
        pass

    assert exc.value.code == 1008
    with _connect(ws_client, ticket):
        assert user.id in connection_manager.active_connections
