-- Destructive cleanup: run with the backend stopped and a database backup.
-- Preserve an existing host membership unless a newer guest membership
-- points to a lobby whose host is guaranteed to remain.
BEGIN;
SET LOCAL lock_timeout = '5s';

DO $$
DECLARE
    extra_host_lobby_ids integer[] := ARRAY[]::integer[];
    next_lobby_id integer;
    deleted_lobby_ids integer[] := ARRAY[]::integer[];
    deleted_lobby_count bigint := 0;
    affected_member_count bigint := 0;
    affected_message_count bigint := 0;
    deleted_membership_count bigint := 0;
    n_members bigint;
    n_messages bigint;
    n_deleted bigint;
BEGIN
    -- Lock *before* inspecting the constraint: concurrent migration runs
    -- cannot both pass the existence check and perform cleanup.
    LOCK TABLE lobbies, lobby_members, lobby_messages
        IN ACCESS EXCLUSIVE MODE;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_lobby_members_user_id'
          AND conrelid = 'lobby_members'::regclass
    ) THEN
        -- A user could previously host several lobbies. Keep the most
        -- recently joined host membership as the initial safe fallback.
        SELECT COALESCE(
            array_agg(lobby_id ORDER BY lobby_id),
            ARRAY[]::integer[]
        )
        INTO extra_host_lobby_ids
        FROM (
            SELECT
                lobby_id,
                ROW_NUMBER() OVER (
                    PARTITION BY user_id
                    ORDER BY joined_at DESC, id DESC
                ) AS rn
            FROM lobby_members
            WHERE role = 'host'
        ) AS ranked_hosts
        WHERE rn > 1;

        FOREACH next_lobby_id IN ARRAY extra_host_lobby_ids LOOP
            SELECT COUNT(*) INTO n_members
            FROM lobby_members
            WHERE lobby_id = next_lobby_id;

            SELECT COUNT(*) INTO n_messages
            FROM lobby_messages
            WHERE lobby_id = next_lobby_id;

            DELETE FROM lobbies WHERE id = next_lobby_id;
            GET DIAGNOSTICS n_deleted = ROW_COUNT;

            IF n_deleted > 0 THEN
                deleted_lobby_ids := array_append(deleted_lobby_ids, next_lobby_id);
                deleted_lobby_count := deleted_lobby_count + n_deleted;
                affected_member_count := affected_member_count + n_members;
                affected_message_count := affected_message_count + n_messages;
            END IF;
        END LOOP;

        -- Resolve newer guest memberships *one lobby at a time*.
        -- A host's lobby may be removed only if their newer guest lobby has
        -- a stable host (one with no more recent membership anywhere).
        -- After each deletion, cascades are reflected in the next query.
        LOOP
            next_lobby_id := NULL;

            SELECT source_host.lobby_id
            INTO next_lobby_id
            FROM lobby_members AS source_host
            JOIN lobby_members AS guest
              ON guest.user_id = source_host.user_id
             AND guest.role = 'guest'
             AND (guest.joined_at, guest.id) >
                 (source_host.joined_at, source_host.id)
            JOIN lobby_members AS target_host
              ON target_host.lobby_id = guest.lobby_id
             AND target_host.role = 'host'
            WHERE source_host.role = 'host'
              AND NOT EXISTS (
                  SELECT 1
                  FROM lobby_members AS newer
                  WHERE newer.user_id = target_host.user_id
                    AND (newer.joined_at, newer.id) >
                        (target_host.joined_at, target_host.id)
              )
            ORDER BY guest.joined_at DESC, guest.id DESC, source_host.lobby_id
            LIMIT 1;

            EXIT WHEN next_lobby_id IS NULL;

            SELECT COUNT(*) INTO n_members
            FROM lobby_members
            WHERE lobby_id = next_lobby_id;

            SELECT COUNT(*) INTO n_messages
            FROM lobby_messages
            WHERE lobby_id = next_lobby_id;

            DELETE FROM lobbies WHERE id = next_lobby_id;
            GET DIAGNOSTICS n_deleted = ROW_COUNT;

            IF n_deleted > 0 THEN
                deleted_lobby_ids := array_append(deleted_lobby_ids, next_lobby_id);
                deleted_lobby_count := deleted_lobby_count + n_deleted;
                affected_member_count := affected_member_count + n_members;
                affected_message_count := affected_message_count + n_messages;
            END IF;
        END LOOP;

        -- For unresolved chains/cycles, keep remaining hosts rather than
        -- deleting a host whose preferred guest lobby might disappear.
        -- For guest-only users, keep their newest remaining membership.
        WITH ranked_members AS (
            SELECT
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY user_id
                    ORDER BY
                        CASE WHEN role = 'host' THEN 0 ELSE 1 END,
                        joined_at DESC,
                        id DESC
                ) AS rn
            FROM lobby_members
        )
        DELETE FROM lobby_members AS member
        USING ranked_members AS ranked
        WHERE member.id = ranked.id
          AND ranked.rn > 1;

        GET DIAGNOSTICS deleted_membership_count = ROW_COUNT;

        ALTER TABLE lobby_members
        ADD CONSTRAINT uq_lobby_members_user_id
        UNIQUE (user_id);

        RAISE NOTICE
            'Deleted % lobbies (IDs: %), affecting % memberships and % messages',
            deleted_lobby_count, deleted_lobby_ids,
            affected_member_count, affected_message_count;
        RAISE NOTICE
            'Deleted % additional duplicate memberships',
            deleted_membership_count;
        RAISE NOTICE 'Unique lobby membership constraint created';
    ELSE
        RAISE NOTICE 'Unique lobby membership constraint already exists; skipping';
    END IF;
END $$;

COMMIT;
