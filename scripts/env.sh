#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE=".env"
ENV_SECRET_FILE=".env.secrets"

ENV_EXAMPLE=".env.example"
ENV_SECRET_EXAMPLE=".env.secrets.example"


ensure_env()
{
	if [ ! -f "$ENV_FILE" ]; then
		if [ ! -f "$ENV_EXAMPLE" ]; then
			echo "Missing $ENV_FILE and $ENV_EXAMPLE."
			exit 1
		fi

		cp "$ENV_EXAMPLE" "$ENV_FILE"
		echo "Created $ENV_FILE from $ENV_EXAMPLE."
	fi

	if [ ! -f "$ENV_SECRET_FILE" ]; then
		if [ ! -f "$ENV_SECRET_EXAMPLE" ]; then
			echo "Missing $ENV_SECRET_FILE and $ENV_SECRET_EXAMPLE."
			exit 1
		fi

		cp "$ENV_SECRET_EXAMPLE" "$ENV_SECRET_FILE"
		echo "Created $ENV_SECRET_FILE from $ENV_SECRET_EXAMPLE."
	fi

	touch "$ENV_SECRET_FILE"

	VALUE="$(sed -n 's/^POSTGRES_PASSWORD=//p' "$ENV_SECRET_FILE" | tail -n 1 | tr -d '\r')"

	if [ -z "$VALUE" ] ||
		[ "$VALUE" = "replace-with-a-password" ]
	then
		echo "Generating POSTGRES_PASSWORD..."

		PASSWORD="$(
			python3 -c 'import secrets; print(secrets.token_urlsafe(32))'
		)"

		if grep -q '^POSTGRES_PASSWORD=' "$ENV_SECRET_FILE"; then
			sed "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$PASSWORD|" \
				"$ENV_SECRET_FILE" > "$ENV_SECRET_FILE.tmp"

			mv "$ENV_SECRET_FILE.tmp" "$ENV_SECRET_FILE"
		else
			echo "POSTGRES_PASSWORD=$PASSWORD" >> "$ENV_SECRET_FILE"
		fi

		if grep -q '^DATABASE_URL=' "$ENV_SECRET_FILE"; then
			sed \
				"s|^DATABASE_URL=.*|DATABASE_URL=postgresql+psycopg://game_user:$PASSWORD@db:5432/game_db|" \
				"$ENV_SECRET_FILE" > "$ENV_SECRET_FILE.tmp"

			mv "$ENV_SECRET_FILE.tmp" "$ENV_SECRET_FILE"
		else
			echo \
				"DATABASE_URL=postgresql+psycopg://game_user:$PASSWORD@db:5432/game_db" \
				>> "$ENV_SECRET_FILE"
		fi
	fi

	VALUE="$(sed -n 's/^SECRET_KEY=//p' "$ENV_SECRET_FILE" | tail -n 1 | tr -d '\r')"

	if [ -z "$VALUE" ] ||
		[ "$VALUE" = "replace-with-a-random-secret" ] ||
		[ "${#VALUE}" -lt 32 ]
	then
		echo "Generating SECRET_KEY..."

		KEY="$(
			python3 -c 'import secrets; print(secrets.token_urlsafe(64))'
		)"

		if grep -q '^SECRET_KEY=' "$ENV_SECRET_FILE"; then
			sed "s|^SECRET_KEY=.*|SECRET_KEY=$KEY|" \
				"$ENV_SECRET_FILE" > "$ENV_SECRET_FILE.tmp"

			mv "$ENV_SECRET_FILE.tmp" "$ENV_SECRET_FILE"
		else
			echo "SECRET_KEY=$KEY" >> "$ENV_SECRET_FILE"
		fi
	fi

	VALUE="$(sed -n 's/^TWO_FACTOR_ENCRYPTION_KEY=//p' "$ENV_SECRET_FILE" | tail -n 1 | tr -d '\r')"

	if [ -z "$VALUE" ] ||
		[ "$VALUE" = "replace-with-a-fernet-key" ] ||
		! python3 -c \
			'import base64, sys; key = base64.urlsafe_b64decode(sys.argv[1].encode()); sys.exit(0 if len(key) == 32 else 1)' \
			"$VALUE" 2>/dev/null
	then
		echo "Generating TWO_FACTOR_ENCRYPTION_KEY..."

		KEY="$(
			python3 -c \
				'import base64, secrets; print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())'
		)"

		if grep -q '^TWO_FACTOR_ENCRYPTION_KEY=' "$ENV_SECRET_FILE"; then
			sed \
				"s|^TWO_FACTOR_ENCRYPTION_KEY=.*|TWO_FACTOR_ENCRYPTION_KEY=$KEY|" \
				"$ENV_SECRET_FILE" > "$ENV_SECRET_FILE.tmp"

			mv "$ENV_SECRET_FILE.tmp" "$ENV_SECRET_FILE"
		else
			echo "TWO_FACTOR_ENCRYPTION_KEY=$KEY" >> "$ENV_SECRET_FILE"
		fi
	fi

	VALUE="$(sed -n 's/^TWO_FACTOR_RECOVERY_HMAC_KEY=//p' "$ENV_SECRET_FILE" | tail -n 1 | tr -d '\r')"

	if [ -z "$VALUE" ] ||
		[ "$VALUE" = "replace-with-a-long-random-secret" ] ||
		[ "${#VALUE}" -lt 32 ]
	then
		echo "Generating TWO_FACTOR_RECOVERY_HMAC_KEY..."

		KEY="$(
			python3 -c 'import secrets; print(secrets.token_urlsafe(64))'
		)"

		if grep -q '^TWO_FACTOR_RECOVERY_HMAC_KEY=' "$ENV_SECRET_FILE"; then
			sed \
				"s|^TWO_FACTOR_RECOVERY_HMAC_KEY=.*|TWO_FACTOR_RECOVERY_HMAC_KEY=$KEY|" \
				"$ENV_SECRET_FILE" > "$ENV_SECRET_FILE.tmp"

			mv "$ENV_SECRET_FILE.tmp" "$ENV_SECRET_FILE"
		else
			echo "TWO_FACTOR_RECOVERY_HMAC_KEY=$KEY" >> "$ENV_SECRET_FILE"
		fi
	fi
}


rotate_2fa_key()
{
	KEY="$(
		python3 -c \
			'import base64, secrets; print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())'
	)"

	if grep -q '^TWO_FACTOR_ENCRYPTION_KEY=' "$ENV_SECRET_FILE"; then
		sed \
			"s|^TWO_FACTOR_ENCRYPTION_KEY=.*|TWO_FACTOR_ENCRYPTION_KEY=$KEY|" \
			"$ENV_SECRET_FILE" > "$ENV_SECRET_FILE.tmp"

		mv "$ENV_SECRET_FILE.tmp" "$ENV_SECRET_FILE"
	else
		echo "TWO_FACTOR_ENCRYPTION_KEY=$KEY" >> "$ENV_SECRET_FILE"
	fi

	echo \
		"TWO_FACTOR_ENCRYPTION_KEY rotated. Existing encrypted TOTP secrets must be reset or re-encrypted."
}


case "${1:-}" in
	ensure)
		ensure_env
		;;

	rotate-2fa-key)
		ensure_env
		rotate_2fa_key
		;;

	*)
		echo "Usage: $0 {ensure|rotate-2fa-key}"
		exit 1
		;;
esac
