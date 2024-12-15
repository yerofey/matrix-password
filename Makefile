# Variables
COMPOSE_CMD = docker compose

# Default target
help:
	@echo "Available commands:"
	@echo "  make up        - Start the services"
	@echo "  make down      - Stop the services"
	@echo "  make restart   - Restart the services"
	@echo "  make build     - Build or rebuild the services"
	@echo "  make logs      - View logs for all services"
	@echo "  make logs-app  - View logs for the Node.js app service"
	@echo "  make logs-caddy - View logs for the Caddy service"
	@echo "  make clean     - Remove all services and volumes"

# Targets
up:
	@$(COMPOSE_CMD) up -d

down:
	@$(COMPOSE_CMD) down

restart: down up
	@echo "Services restarted."

build:
	@$(COMPOSE_CMD) build

logs:
	@$(COMPOSE_CMD) logs -f

logs-app:
	@$(COMPOSE_CMD) logs -f app

logs-caddy:
	@$(COMPOSE_CMD) logs -f caddy

clean:
	@$(COMPOSE_CMD) down -v
	@echo "All services and volumes removed."
