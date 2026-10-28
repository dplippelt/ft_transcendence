#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE=(
	docker compose
	-f ./docker-compose.yml
	--env-file .env
	--env-file .env.secrets
)

MIGRATIONS_DIR="services/backend/migrations"

MIGRATIONS=(
    "$MIGRATIONS_DIR/20260913_add_two_factor_management_timecode.sql"
    "$MIGRATIONS_DIR/20261028_unique_lobby_membership.sql"
)


wait_for_db()
{
	echo "Waiting for PostgreSQL..."

	until "${COMPOSE[@]}" exec -T db sh -c \
		'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
		>/dev/null 2>&1
	do
		sleep 1
	done
}


migrate()
{
    for migration in "${MIGRATIONS[@]}"; do
        if [ ! -f "$migration" ]; then
            echo "Missing migration: $migration"
            exit 1
        fi
    done

    echo "Starting PostgreSQL..."
    "${COMPOSE[@]}" up -d db

    wait_for_db

    for migration in "${MIGRATIONS[@]}"; do
        echo "Applying migration: $migration"

        "${COMPOSE[@]}" exec -T db sh -c \
            'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
            < "$migration"
    done

    echo "Database migrations applied."
}

check_users()
{
	"${COMPOSE[@]}" exec -T db sh -c \
		'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\d users"'
}

check_2fa()
{
	"${COMPOSE[@]}" exec -T db sh -c \
		'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
		"SELECT column_name FROM information_schema.columns \
		WHERE table_name = '\''users'\'' \
		AND column_name = '\''two_factor_last_management_timecode'\'';"'
}

case "${1:-}" in
	migrate)
		migrate
		;;
	check-users)
		check_users
		;;
	check-2fa)
		check_2fa
		;;
	*)
		echo "Usage: $0 {migrate|check-users|check-2fa}"
		exit 1
		;;
esac
