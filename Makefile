# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: dlippelt <dlippelt@student.codam.nl>       +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/05/18 10:09:39 by dlippelt          #+#    #+#              #
#    Updated: 2026/06/12 07:42:31 by dlippelt         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

DCOMP =			./srcs/docker-compose.yml

VOLUME_DIRS =	$(HOME)/ft_transcendence

# use setup only on a freshly cloned repo
setup:
	cd srcs/services/frontend/app && npm install
	$(MAKE) build

build:
	@mkdir -p $(VOLUME_DIRS)/frontend_data
	docker compose -f $(DCOMP) build

up:
	docker compose -f $(DCOMP) up -d

down:
	docker compose -f $(DCOMP) down

start:
	docker compose -f $(DCOMP) start

stop:
	docker compose -f $(DCOMP) stop

restart:
	docker compose -f $(DCOMP) restart

re:
	$(MAKE) down || true
	$(MAKE) build
	$(MAKE) up

clean:
	$(MAKE) down || true
	docker system prune -a --volumes -f

fclean: clean
	docker volume rm transc_frontend_data 2>/dev/null || true
	sudo rm -rf $(VOLUME_DIRS)
	sudo rm -rf srcs/services/frontend/app/node_modules

fre: fclean setup up

.PHONY: setup build up down start stop restart re clean fclean fre
