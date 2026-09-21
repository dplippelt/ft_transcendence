DCOMP =			./docker-compose.yml

VOLUME_DIRS =	$(HOME)/ft_transcendence

POSTGRES_VOLUME = ft_transcendence_postgres_data

ENV_FILE = .env
ENV_SECRET_FILE = .env.secrets

COMPOSE = docker compose -f $(DCOMP) \
	--env-file $(ENV_FILE) \
	--env-file $(ENV_SECRET_FILE)

ensure-env:
	./scripts/env.sh ensure

rotate-2fa-key:
	./scripts/env.sh rotate-2fa-key

setup: ensure-env
	$(MAKE) build

build: ensure-env
	@mkdir -p $(VOLUME_DIRS)/frontend_data
	$(COMPOSE) build

check-frontend: ensure-env
	$(COMPOSE) run --rm frontend npm run build

lint-backend: ensure-env
	$(COMPOSE) run --rm backend \
		python -m ruff check app tests

lint-backend-fix: ensure-env
	$(COMPOSE) run --rm backend \
		python -m ruff check app tests --fix

check-backend: ensure-env
	$(COMPOSE) run --rm backend \
		python -m compileall -q /app/app
	$(COMPOSE) run --rm backend \
		python -c "import app.main"
	$(MAKE) lint-backend

check: ensure-env check-frontend check-backend

dead-code: ensure-env
	$(COMPOSE) run --rm backend \
		python -m vulture app tests --min-confidence 100

migrate-db: ensure-env
	./scripts/db.sh migrate

check-users-table: ensure-env
	./scripts/db.sh check-users

check-2fa-migration: ensure-env
	./scripts/db.sh check-2fa

up: ensure-env
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

start: ensure-env
	$(COMPOSE) start

stop:
	$(COMPOSE) stop

test: ensure-env
	./scripts/test.sh all

test-auth: ensure-env
	./scripts/test.sh auth

test-security: ensure-env
	./scripts/test.sh security

test-2fa: ensure-env
	./scripts/test.sh two-factor

test-lobby: ensure-env
	./scripts/test.sh lobby

reset-db: ensure-env
	$(MAKE) down || true
	docker volume rm $(POSTGRES_VOLUME) 2>/dev/null || true
	$(COMPOSE) up -d

restart: ensure-env
	$(COMPOSE) restart

re: ensure-env
	$(MAKE) down || true
	$(MAKE) build
	$(MAKE) check
	$(MAKE) up

clean:
	$(MAKE) down || true

fclean:
	$(COMPOSE) down -v || true
	sudo rm -rf $(VOLUME_DIRS)
	sudo rm -rf services/frontend/app/node_modules

fre: fclean setup check up

.PHONY: ensure-env rotate-2fa-key \
	setup build check check-frontend check-backend \
	lint-backend lint-backend-fix dead-code \
	test test-auth test-security test-2fa test-lobby \
	migrate-db check-users-table check-2fa-migration \
	up down start stop restart reset-db re clean fclean fre
