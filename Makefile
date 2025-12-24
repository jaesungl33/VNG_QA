# VNG QA Development Makefile

.PHONY: help install dev dev-web dev-api build lint format test db-up db-down db-migrate db-reset clean

help: ## Show this help message
	@echo "VNG QA Development Commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

install: ## Install all dependencies
	pnpm install
	pip install -r apps/api/requirements.txt

dev: ## Start both web and API in development mode
	pnpm run dev

dev-web: ## Start web development server
	pnpm run dev:web

dev-api: ## Start API development server
	pnpm run dev:api

build: ## Build all packages
	pnpm run build

lint: ## Run linting
	pnpm run lint

format: ## Run code formatting
	pnpm run format

test: ## Run tests
	pnpm run test

db-up: ## Start database services
	docker-compose -f infra/docker/docker-compose.yml up -d

db-down: ## Stop database services
	docker-compose -f infra/docker/docker-compose.yml down

db-migrate: ## Run database migrations
	cd apps/api && alembic upgrade head

db-reset: ## Reset database (drop all and migrate)
	cd apps/api && alembic downgrade base && alembic upgrade head

clean: ## Clean up development artifacts
	rm -rf node_modules apps/*/node_modules packages/*/node_modules apps/api/__pycache__ apps/api/app/__pycache__
