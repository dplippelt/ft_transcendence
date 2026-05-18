# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: dlippelt <dlippelt@student.codam.nl>       +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/05/18 10:09:39 by dlippelt          #+#    #+#              #
#    Updated: 2026/05/18 10:19:55 by dlippelt         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

DCOMP =				./srcs/docker-compose.yml

# change volume folder name!
VOLUME_DIRS =		$(HOME)/temp_transc_data

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

fre: fclean re

.PHONY: build up down start stop restart re clean fclean fre
