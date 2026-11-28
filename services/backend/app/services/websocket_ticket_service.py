import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models.websocket_ticket import WebSocketTicket

WS_TICKET_TTL_SECONDS = 30


def _hash_ticket(ticket: str) -> str:
    return hashlib.sha256(ticket.encode("utf-8")).hexdigest()


def create_websocket_ticket(db: Session, user_id: int) -> str:
    # Opportunistic cleanup prevents expired tickets building up indefinitely.
    # Issuing tickets for different tabs must not invalidate one another.
    now = datetime.now(UTC)
    db.execute(
        delete(WebSocketTicket)
        .where(WebSocketTicket.expires_at <= now)
        .execution_options(synchronize_session=False)
    )

    ticket = secrets.token_urlsafe(32)
    db.add(WebSocketTicket(
        ticket_hash=_hash_ticket(ticket),
        user_id=user_id,
        expires_at=now + timedelta(seconds=WS_TICKET_TTL_SECONDS),
    ))
    db.commit()
    return ticket


def consume_websocket_ticket(db: Session, ticket: str) -> int | None:
    if not ticket or len(ticket) > 256:
        return None

    # Atomic DELETE ... RETURNING: only one concurrent connection can redeem
    # a given ticket. This works with PostgreSQL and recent SQLite versions.
    statement = (
        delete(WebSocketTicket)
        .where(
            WebSocketTicket.ticket_hash == _hash_ticket(ticket),
            WebSocketTicket.expires_at > datetime.now(UTC),
        )
        .returning(WebSocketTicket.user_id)
        .execution_options(synchronize_session=False)
    )
    user_id = db.execute(statement).scalar_one_or_none()

    if user_id is None:
        db.rollback()
        return None

    db.commit()
    return user_id
