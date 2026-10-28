DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_lobby_members_user_id'
          AND conrelid = 'lobby_members'::regclass
    ) THEN
        ALTER TABLE lobby_members
        ADD CONSTRAINT uq_lobby_members_user_id
        UNIQUE (user_id);
    END IF;
END $$;
