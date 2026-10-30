DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_lobby_members_user_id'
          AND conrelid = 'lobby_members'::regclass
    ) THEN

        -- Keep each user's oldest hosted lobby.
        -- Delete their other hosted lobbies.
        DELETE FROM lobbies
        WHERE id IN (
            SELECT lobby_id
            FROM (
                SELECT
                    lobby_id,
                    ROW_NUMBER() OVER (
                        PARTITION BY user_id
                        ORDER BY joined_at, id
                    ) AS rn
                FROM lobby_members
                WHERE role = 'host'
            ) ranked
            WHERE rn > 1
        );

        -- Keep one membership per user.
        -- Prefer host membership, then oldest membership.
        DELETE FROM lobby_members
        WHERE id IN (
            SELECT id
            FROM (
                SELECT
                    id,
                    ROW_NUMBER() OVER (
                        PARTITION BY user_id
                        ORDER BY
                            CASE WHEN role = 'host' THEN 0 ELSE 1 END,
                            joined_at,
                            id
                    ) AS rn
                FROM lobby_members
            ) ranked
            WHERE rn > 1
        );

        -- Remove lobbies without a host.
        DELETE FROM lobbies
        WHERE NOT EXISTS (
            SELECT 1
            FROM lobby_members
            WHERE lobby_members.lobby_id = lobbies.id
              AND lobby_members.role = 'host'
        );

        -- Enforce one membership per user.
        ALTER TABLE lobby_members
        ADD CONSTRAINT uq_lobby_members_user_id
        UNIQUE (user_id);

    END IF;
END $$;
