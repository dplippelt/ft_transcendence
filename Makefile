DCOMP =			./docker-compose.yml

VOLUME_DIRS =	$(HOME)/ft_transcendence

POSTGRES_VOLUME = ft_transcendence_postgres_data

ENV_FILE = .env
ENV_EXAMPLE = .env.example

ensure-env:
	@if [ ! -f $(ENV_FILE) ]; then \
		if [ ! -f $(ENV_EXAMPLE) ]; then \
			echo "Missing $(ENV_FILE) and $(ENV_EXAMPLE)."; \
			exit 1; \
		fi; \
		cp $(ENV_EXAMPLE) $(ENV_FILE); \
		echo "Created $(ENV_FILE) from $(ENV_EXAMPLE)."; \
	fi
	@$(MAKE) --no-print-directory ensure-2fa-secrets

ensure-2fa-secrets:
	@touch $(ENV_FILE)
	@VALUE=$$(sed -n 's/^TWO_FACTOR_ENCRYPTION_KEY=//p' $(ENV_FILE) | tail -n 1); \
	if [ -z "$$VALUE" ] || \
		[ "$$VALUE" = "replace-with-a-fernet-key" ] || \
		! python3 -c 'import base64, sys; key = base64.urlsafe_b64decode(sys.argv[1].encode()); sys.exit(0 if len(key) == 32 else 1)' "$$VALUE" 2>/dev/null; then \
		echo "Generating TWO_FACTOR_ENCRYPTION_KEY..."; \
		KEY=$$(python3 -c 'import base64, secrets; print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())'); \
		if grep -q '^TWO_FACTOR_ENCRYPTION_KEY=' $(ENV_FILE); then \
			sed -i "s|^TWO_FACTOR_ENCRYPTION_KEY=.*|TWO_FACTOR_ENCRYPTION_KEY=$$KEY|" $(ENV_FILE); \
		else \
			echo "TWO_FACTOR_ENCRYPTION_KEY=$$KEY" >> $(ENV_FILE); \
		fi; \
	fi

	@VALUE=$$(sed -n 's/^TWO_FACTOR_RECOVERY_HMAC_KEY=//p' $(ENV_FILE) | tail -n 1); \
	if [ -z "$$VALUE" ] || \
		[ "$$VALUE" = "replace-with-a-long-random-secret" ] || \
		[ $${#VALUE} -lt 32 ]; then \
		echo "Generating TWO_FACTOR_RECOVERY_HMAC_KEY..."; \
		KEY=$$(python3 -c 'import secrets; print(secrets.token_urlsafe(64))'); \
		if grep -q '^TWO_FACTOR_RECOVERY_HMAC_KEY=' $(ENV_FILE); then \
			sed -i "s|^TWO_FACTOR_RECOVERY_HMAC_KEY=.*|TWO_FACTOR_RECOVERY_HMAC_KEY=$$KEY|" $(ENV_FILE); \
		else \
			echo "TWO_FACTOR_RECOVERY_HMAC_KEY=$$KEY" >> $(ENV_FILE); \
		fi; \
	fi

rotate-2fa-key: ensure-env
	@KEY=$$(python3 -c 'import base64, secrets; print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())'); \
	if grep -q '^TWO_FACTOR_ENCRYPTION_KEY=' $(ENV_FILE); then \
		sed -i "s|^TWO_FACTOR_ENCRYPTION_KEY=.*|TWO_FACTOR_ENCRYPTION_KEY=$$KEY|" $(ENV_FILE); \
	else \
		echo "TWO_FACTOR_ENCRYPTION_KEY=$$KEY" >> $(ENV_FILE); \
	fi
	@echo "TWO_FACTOR_ENCRYPTION_KEY rotated. Existing encrypted TOTP secrets must be reset or re-encrypted."

setup: ensure-env
	$(MAKE) build

build: ensure-env
	@mkdir -p $(VOLUME_DIRS)/frontend_data
	docker compose -f $(DCOMP) build

check-frontend: ensure-env
	docker compose -f $(DCOMP) run --rm frontend npm run build

lint-backend: ensure-env
	docker compose -f $(DCOMP) run --rm backend \
		python -m ruff check app tests

lint-backend-fix: ensure-env
	docker compose -f $(DCOMP) run --rm backend \
		python -m ruff check app tests --fix

check-backend: ensure-env
	docker compose -f $(DCOMP) run --rm backend \
		python -m compileall -q /app/app
	docker compose -f $(DCOMP) run --rm backend \
		python -c "import app.main"
	$(MAKE) lint-backend

check: ensure-env check-frontend check-backend

dead-code: ensure-env
	docker compose -f $(DCOMP) run --rm backend \
		python -m vulture app tests --min-confidence 100

up: ensure-env
	docker compose -f $(DCOMP) up -d

down:
	docker compose -f $(DCOMP) down

start: ensure-env
	docker compose -f $(DCOMP) start

stop:
	docker compose -f $(DCOMP) stop

test: ensure-env
	docker compose -f $(DCOMP) run --rm backend \
		python -m pytest tests -v --maxfail=1 --disable-warnings

test-auth: ensure-env
	docker compose -f $(DCOMP) run --rm backend \
		python -m pytest tests/test_auth.py -v --maxfail=1

test-security: ensure-env
	docker compose -f $(DCOMP) run --rm backend \
		python -m pytest tests/test_security.py -v --maxfail=1

test-2fa-auth: ensure-env
	docker compose -f $(DCOMP) run --rm backend \
		python -m pytest tests/test_two_factor_auth.py -v --maxfail=1

test-2fa-service: ensure-env
	docker compose -f $(DCOMP) run --rm backend \
		python -m pytest tests/test_two_factor_service.py -v --maxfail=1

reset-db: ensure-env
	$(MAKE) down || true
	docker volume rm $(POSTGRES_VOLUME) 2>/dev/null || true
	docker compose -f $(DCOMP) up -d

restart: ensure-env
	docker compose -f $(DCOMP) restart

re: ensure-env
	$(MAKE) down || true
	$(MAKE) build
	$(MAKE) check
	$(MAKE) up

clean:
	$(MAKE) down || true

fclean:
	docker compose -f $(DCOMP) down -v || true
	sudo rm -rf $(VOLUME_DIRS)
	sudo rm -rf services/frontend/app/node_modules

fre: fclean setup check up

.PHONY: ensure-env ensure-2fa-secrets rotate-2fa-key \
	setup build check check-frontend check-backend \
	lint-backend lint-backend-fix dead-code \
	test test-auth test-security test-2fa-auth test-2fa-service \
	up down start stop restart reset-db re clean fclean fre
