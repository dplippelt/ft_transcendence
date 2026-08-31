DCOMP =			./docker-compose.yml

VOLUME_DIRS =	$(HOME)/ft_transcendence

POSTGRES_VOLUME = ft_transcendence_postgres_data

ENV_FILE = .env

ensure-2fa-secrets:
	@if ! grep -q '^TWO_FACTOR_ENCRYPTION_KEY=.\+' $(ENV_FILE) 2>/dev/null || \
		grep -q '^TWO_FACTOR_ENCRYPTION_KEY=replace-with-a-fernet-key' $(ENV_FILE) 2>/dev/null; then \
		echo "Generating TWO_FACTOR_ENCRYPTION_KEY..."; \
		KEY=$$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"); \
		sed -i "s|^TWO_FACTOR_ENCRYPTION_KEY=.*|TWO_FACTOR_ENCRYPTION_KEY=$$KEY|" $(ENV_FILE); \
	fi

	@if ! grep -q '^TWO_FACTOR_RECOVERY_HMAC_KEY=.\+' $(ENV_FILE) 2>/dev/null || \
	    grep -q '^TWO_FACTOR_RECOVERY_HMAC_KEY=replace-with-a-long-random-secret' $(ENV_FILE) 2>/dev/null; then \
		echo "Generating TWO_FACTOR_RECOVERY_HMAC_KEY..."; \
		KEY=$$(python3 -c "import secrets; print(secrets.token_urlsafe(64))"); \
		sed -i "s|^TWO_FACTOR_RECOVERY_HMAC_KEY=.*|TWO_FACTOR_RECOVERY_HMAC_KEY=$$KEY|" $(ENV_FILE); \
	fi

rotate-2fa-key:
	@KEY=$$(docker compose -f $(DCOMP) run --rm --no-deps backend \
		python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"); \
	sed -i "s|^TWO_FACTOR_ENCRYPTION_KEY=.*|TWO_FACTOR_ENCRYPTION_KEY=$$KEY|" $(ENV_FILE)
	@echo "TWO_FACTOR_ENCRYPTION_KEY rotated."

setup:
	$(MAKE) ensure-2fa-secrets
	$(MAKE) build

build:
	@mkdir -p $(VOLUME_DIRS)/frontend_data
	docker compose -f $(DCOMP) build

check-frontend:
	docker compose -f $(DCOMP) run --rm frontend npm run build

lint-backend:
	docker compose -f $(DCOMP) run --rm backend \
		python -m ruff check app tests

lint-backend-fix:
	docker compose -f $(DCOMP) run --rm backend \
		python -m ruff check app tests --fix

check-backend:
	docker compose -f $(DCOMP) run --rm backend \
		python -m compileall -q /app/app
	docker compose -f $(DCOMP) run --rm backend \
		python -c "import app.main"
	$(MAKE) lint-backend

check: check-frontend check-backend

dead-code:
	docker compose -f $(DCOMP) run --rm backend \
		python -m vulture app tests --min-confidence 100

up:
	docker compose -f $(DCOMP) up -d

down:
	docker compose -f $(DCOMP) down

start:
	docker compose -f $(DCOMP) start

stop:
	docker compose -f $(DCOMP) stop

test:
	docker compose -f $(DCOMP) run --rm backend \
		python -m pytest tests -v --maxfail=1 --disable-warnings

test-auth:
	docker compose -f $(DCOMP) run --rm backend \
		python -m pytest tests/test_auth.py -v --maxfail=1

test-security:
	docker compose -f $(DCOMP) run --rm backend \
		python -m pytest tests/test_security.py -v --maxfail=1

test-2fa-auth:
	docker compose -f $(DCOMP) run --rm backend \
		python -m pytest tests/test_two_factor_auth.py -v --maxfail=1

test-2fa-service:
	docker compose -f $(DCOMP) run --rm backend \
		python -m pytest tests/test_two_factor_service.py -v --maxfail=1

reset-db:
	$(MAKE) down || true
	docker volume rm $(POSTGRES_VOLUME) 2>/dev/null || true
	docker compose -f $(DCOMP) up -d

restart:
	docker compose -f $(DCOMP) restart

re:
	$(MAKE) down || true
	$(MAKE) ensure-2fa-secrets
	$(MAKE) build
	$(MAKE) check
	$(MAKE) up

clean:
	$(MAKE) down || true

fclean:
	docker compose -f $(DCOMP) down -v || true
	docker volume rm transc_frontend_data 2>/dev/null || true
	sudo rm -rf $(VOLUME_DIRS)
	sudo rm -rf services/frontend/app/node_modules

fre: fclean setup check up

.PHONY: setup build check check-frontend check-backend \
	test test-auth test-security test-2fa-auth test-2fa-service \
	lint-backend-fix dead-code setup build ensure-2fa-key rotate-2fa-key \
	up down start stop restart reset-db re clean fclean fre
