# Variables
PORT ?= 3000

.PHONY: dev dev-clean db-push db-migrate help

# Main development command
dev:
	@echo "🚀 Starting development..."
	@npm install --silent
	@echo "✅ Ready! Starting server on port $(PORT)"
	@npm run dev

# Clean start (kills port first)
dev-clean:
	@echo "🧹 Cleaning port $(PORT) and starting fresh..."
	@npx kill-port $(PORT) 2>/dev/null || true
	@$(MAKE) --no-print-directory dev

# Database commands
db-push:
	@echo "📊 Pushing schema changes to database..."
	@npx drizzle-kit push

db-migrate:
	@echo "📊 Generating and running migrations..."
	@npx drizzle-kit generate
	@npx drizzle-kit migrate

# Show available commands
help:
	@echo "Available commands:"
	@echo "  make dev        - Install deps, start dev server (no migrations)"
	@echo "  make dev-clean  - Kill port $(PORT) first, then start dev"
	@echo "  make db-push    - Push schema changes directly to database"
	@echo "  make db-migrate - Generate and run migrations"
	@echo "  make help       - Show this help"

.DEFAULT_GOAL := dev
