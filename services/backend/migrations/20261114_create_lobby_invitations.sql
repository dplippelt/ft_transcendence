-- Recipient-scoped, expiring, one-time-use lobby invitations.
-- Apply with the backend stopped using `make migrate`.
BEGIN;

CREATE TABLE IF NOT EXISTS lobby_invitations (
    id VARCHAR(64) PRIMARY KEY,
    lobby_id INTEGER NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
    inviter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_lobby_invitations_lobby_id ON lobby_invitations(lobby_id);
CREATE INDEX IF NOT EXISTS ix_lobby_invitations_recipient_id ON lobby_invitations(recipient_id);
CREATE INDEX IF NOT EXISTS ix_lobby_invitations_expires_at ON lobby_invitations(expires_at);

COMMIT;
