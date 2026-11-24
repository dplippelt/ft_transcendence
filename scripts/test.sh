#!/usr/bin/env bash

set -euo pipefail


COMPOSE_FILE="./docker-compose.test.yml"
COMPOSE_PROJECT="ft_transcendence-test"

COMPOSE=(
	docker compose
	-p "$COMPOSE_PROJECT"
	-f "$COMPOSE_FILE"
)


cleanup()
{
	"${COMPOSE[@]}" down --remove-orphans
}

trap cleanup EXIT


run_pytest()
{
	local path="$1"
	shift

	"${COMPOSE[@]}" run --rm --build backend-test \
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
    
    friends)
		shift
		run_pytest tests/friends "$@"
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
        echo "  $0 friends"
		exit 1
		;;
esac
