# Car Telemetry Stack - Quick Commands

.PHONY: help build up down logs clean test

help: ## Show this help message
	@echo "Car Telemetry Stack - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build all Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d
	@echo ""
	@echo "Services started!"
	@echo "Dashboard: http://localhost:5173"
	@echo "API: http://localhost:3000"
	@echo "Telemetry Port: 8080"

down: ## Stop all services
	docker-compose down

logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View backend logs
	docker-compose logs -f backend

logs-db: ## View database logs
	docker-compose logs -f db

clean: ## Stop and remove all containers, volumes, and images
	docker-compose down -v
	docker system prune -f

test: ## Run telemetry test script
	node scripts/test-telemetry.js

restart: down up ## Restart all services

