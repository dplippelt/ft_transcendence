DCOMP =			./docker-compose.yml

VOLUME_DIRS =	$(HOME)/ft_transcendence

setup:
	$(MAKE) build

build:
	@mkdir -p $(VOLUME_DIRS)/frontend_data
	docker compose -f $(DCOMP) build

check-frontend:
	docker compose -f $(DCOMP) run --rm frontend npm run build

check-backend:
	docker compose -f $(DCOMP) run --rm backend \
		python -m compileall -q /app/app
	docker compose -f $(DCOMP) run --rm backend \
		python -c "import app.main"

check: check-frontend check-backend

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

test-2FA-auth:
	docker compose -f $(DCOMP) run --rm backend \
		python -m pytest tests/test_two_factor_auth.py -v --maxfail=1

test-2FA-service:
	docker compose -f $(DCOMP) run --rm backend \
		python -m pytest tests/test_two_factor_service.py -v --maxfail=1

restart:
	docker compose -f $(DCOMP) restart

re:
	$(MAKE) down || true
	$(MAKE) build
	$(MAKE) check
	$(MAKE) up

clean:
	$(MAKE) down || true
	docker system prune -a --volumes -f

fclean: clean
	docker volume rm transc_frontend_data 2>/dev/null || true
	sudo rm -rf $(VOLUME_DIRS)
	sudo rm -rf services/frontend/app/node_modules

fre: fclean setup check up

.PHONY: setup build check check-frontend check-backend up down start stop restart re clean fclean fre
