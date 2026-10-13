#!/usr/bin/env bash

set -euo pipefail


COMPOSE_FILE="./docker-compose.yml"
ENV_FILE=".env"
ENV_SECRET_FILE=".env.secrets"

COMPOSE=(
	docker compose
	-f "$COMPOSE_FILE"
	--env-file "$ENV_FILE"
	--env-file "$ENV_SECRET_FILE"
)


run_pytest()
{
	local path="$1"
	shift

	"${COMPOSE[@]}" run --rm backend \
		python -m pytest "$path" \
		-v \
		--maxfail=1 \
        --disable-warnings \
		"$@"
}


case "${1:-all}" in
	all)
		shift || true
		run_pytest tests "$@"
		;;

	auth)
		shift
		run_pytest tests/auth "$@"
		;;

	security)
		shift
		run_pytest tests/security "$@"
		;;

	two-factor)
		shift
		run_pytest tests/two_factor "$@"
		;;

	lobby)
		shift
		run_pytest tests/lobby "$@"
		;;

	*)
		echo "Unknown test group: $1"
		echo
		echo "Usage:"
		echo "  $0 all"
		echo "  $0 auth"
		echo "  $0 security"
		echo "  $0 two-factor"
		echo "  $0 lobby"
		exit 1
		;;
esac
