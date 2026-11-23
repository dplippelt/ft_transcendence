-- Persistent single-use WebSocket tickets, shared by backend workers.
-- Store only the SHA-256 hash; never persist the raw ticket.
CREATE TABLE IF NOT EXISTS websocket_tickets (
    ticket_hash VARCHAR(64) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_websocket_tickets_user_id
    ON websocket_tickets(user_id);
CREATE INDEX IF NOT EXISTS ix_websocket_tickets_expires_at
    ON websocket_tickets(expires_at);
