
DO $$
DECLARE
    deleted_lobby_ids integer[] := ARRAY[]::integer[];
    deleted_lobby_count bigint;
    affected_member_count bigint;
    affected_message_count bigint;
    deleted_membership_count bigint;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_lobby_members_user_id'
          AND conrelid = 'lobby_members'::regclass
    ) THEN
        -- Prevent concurrent writes during cleanup.
        LOCK TABLE lobbies, lobby_members, lobby_messages
        IN ACCESS EXCLUSIVE MODE;

        -- Identify lobbies whose host membership would be
        -- removed. Keep each user's most recent membership.
        SELECT COALESCE(
            array_agg(lobby_id ORDER BY lobby_id),
            ARRAY[]::integer[]
        )
        INTO deleted_lobby_ids
        FROM (
            SELECT
                lobby_id,
                role,
                ROW_NUMBER() OVER (
                    PARTITION BY user_id
                    ORDER BY joined_at DESC, id DESC
                ) AS rn
            FROM lobby_members
        ) ranked
        WHERE role = 'host' AND rn > 1;

        -- Record the data affected by cascading deletion.
        SELECT COUNT(*)
        INTO affected_member_count
        FROM lobby_members
        WHERE lobby_id = ANY(deleted_lobby_ids);

        SELECT COUNT(*)
        INTO affected_message_count
        FROM lobby_messages
        WHERE lobby_id = ANY(deleted_lobby_ids);

        -- Delete only lobbies whose host membership loses.
        DELETE FROM lobbies
        WHERE id = ANY(deleted_lobby_ids);

        GET DIAGNOSTICS deleted_lobby_count = ROW_COUNT;

        RAISE NOTICE
            'Deleted % lobbies (IDs: %), affecting % memberships and % messages',
            deleted_lobby_count,
            deleted_lobby_ids,
            affected_member_count,
            affected_message_count;

        -- Recalculate after cascading deletes, keeping each
        -- remaining user's most recent membership.
        WITH ranked AS (
            SELECT
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY user_id
                    ORDER BY joined_at DESC, id DESC
                ) AS rn
            FROM lobby_members
        )
        DELETE FROM lobby_members AS m
        USING ranked AS r
        WHERE m.id = r.id AND r.rn > 1;

        GET DIAGNOSTICS deleted_membership_count = ROW_COUNT;

        RAISE NOTICE
            'Deleted % additional duplicate memberships',
            deleted_membership_count;

        ALTER TABLE lobby_members
        ADD CONSTRAINT uq_lobby_members_user_id
        UNIQUE (user_id);

        RAISE NOTICE 'Unique lobby membership constraint created';
    END IF;
END $$;
