DCOMP =			./docker-compose.yml

VOLUME_DIRS =	$(HOME)/ft_transcendence

POSTGRES_VOLUME = ft_transcendence_postgres_data

ENV_FILE = .env
ENV_SECRET_FILE = .env.secrets

ENV_EXAMPLE = .env.example
ENV_SECRET_EXAMPLE = .env.secrets.example

COMPOSE = docker compose -f $(DCOMP) \
	--env-file $(ENV_FILE) \
	--env-file $(ENV_SECRET_FILE)

ensure-env:
	@if [ ! -f $(ENV_FILE) ]; then \
		if [ ! -f $(ENV_EXAMPLE) ]; then \
			echo "Missing $(ENV_FILE) and $(ENV_EXAMPLE)."; \
			exit 1; \
		fi; \
		cp $(ENV_EXAMPLE) $(ENV_FILE); \
		echo "Created $(ENV_FILE) from $(ENV_EXAMPLE)."; \
	fi
	@if [ ! -f $(ENV_SECRET_FILE) ]; then \
		if [ ! -f $(ENV_SECRET_EXAMPLE) ]; then \
			echo "Missing $(ENV_SECRET_FILE) and $(ENV_SECRET_EXAMPLE)."; \
			exit 1; \
		fi; \
		cp $(ENV_SECRET_EXAMPLE) $(ENV_SECRET_FILE); \
		echo "Created $(ENV_SECRET_FILE) from $(ENV_SECRET_EXAMPLE)."; \
	fi
	@$(MAKE) --no-print-directory ensure-2fa-secrets

ensure-2fa-secrets:
	@touch $(ENV_SECRET_FILE)
	@VALUE=$$(sed -n 's/^TWO_FACTOR_ENCRYPTION_KEY=//p' $(ENV_SECRET_FILE) | tail -n 1); \
	if [ -z "$$VALUE" ] || \
		[ "$$VALUE" = "replace-with-a-fernet-key" ] || \
		! python3 -c 'import base64, sys; key = base64.urlsafe_b64decode(sys.argv[1].encode()); sys.exit(0 if len(key) == 32 else 1)' "$$VALUE" 2>/dev/null; then \
		echo "Generating TWO_FACTOR_ENCRYPTION_KEY..."; \
		KEY=$$(python3 -c 'import base64, secrets; print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())'); \
		if grep -q '^TWO_FACTOR_ENCRYPTION_KEY=' $(ENV_SECRET_FILE); then \
			sed -i "s|^TWO_FACTOR_ENCRYPTION_KEY=.*|TWO_FACTOR_ENCRYPTION_KEY=$$KEY|" $(ENV_SECRET_FILE); \
		else \
			echo "TWO_FACTOR_ENCRYPTION_KEY=$$KEY" >> $(ENV_SECRET_FILE); \
		fi; \
	fi

	@VALUE=$$(sed -n 's/^TWO_FACTOR_RECOVERY_HMAC_KEY=//p' $(ENV_SECRET_FILE) | tail -n 1); \
	if [ -z "$$VALUE" ] || \
		[ "$$VALUE" = "replace-with-a-long-random-secret" ] || \
		[ $${#VALUE} -lt 32 ]; then \
		echo "Generating TWO_FACTOR_RECOVERY_HMAC_KEY..."; \
		KEY=$$(python3 -c 'import secrets; print(secrets.token_urlsafe(64))'); \
		if grep -q '^TWO_FACTOR_RECOVERY_HMAC_KEY=' $(ENV_SECRET_FILE); then \
			sed -i "s|^TWO_FACTOR_RECOVERY_HMAC_KEY=.*|TWO_FACTOR_RECOVERY_HMAC_KEY=$$KEY|" $(ENV_SECRET_FILE); \
		else \
			echo "TWO_FACTOR_RECOVERY_HMAC_KEY=$$KEY" >> $(ENV_SECRET_FILE); \
		fi; \
	fi

rotate-2fa-key: ensure-env
	@KEY=$$(python3 -c 'import base64, secrets; print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())'); \
	if grep -q '^TWO_FACTOR_ENCRYPTION_KEY=' $(ENV_SECRET_FILE); then \
		sed -i "s|^TWO_FACTOR_ENCRYPTION_KEY=.*|TWO_FACTOR_ENCRYPTION_KEY=$$KEY|" $(ENV_SECRET_FILE); \
	else \
		echo "TWO_FACTOR_ENCRYPTION_KEY=$$KEY" >> $(ENV_SECRET_FILE); \
	fi
	@echo "TWO_FACTOR_ENCRYPTION_KEY rotated. Existing encrypted TOTP secrets must be reset or re-encrypted."

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

up: ensure-env
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

start: ensure-env
	$(COMPOSE) start

stop:
	$(COMPOSE) stop

test: ensure-env
	$(COMPOSE) run --rm backend \
		python -m pytest tests -v --maxfail=1 --disable-warnings

test-auth: ensure-env
	$(COMPOSE) run --rm backend \
		python -m pytest tests/test_auth.py -v --maxfail=1

test-security: ensure-env
	$(COMPOSE) run --rm backend \
		python -m pytest tests/test_security.py -v --maxfail=1

test-2fa-auth: ensure-env
	$(COMPOSE) run --rm backend \
		python -m pytest tests/test_two_factor_auth.py -v --maxfail=1

test-2fa-service: ensure-env
	$(COMPOSE) run --rm backend \
		python -m pytest tests/test_two_factor_service.py -v --maxfail=1

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

.PHONY: ensure-env ensure-2fa-secrets rotate-2fa-key \
	setup build check check-frontend check-backend \
	lint-backend lint-backend-fix dead-code \
	test test-auth test-security test-2fa-auth test-2fa-service \
	up down start stop restart reset-db re clean fclean fre
