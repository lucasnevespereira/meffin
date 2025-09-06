# Variables
PORT ?= 3000

.PHONY: dev dev-clean help

# Main development command
dev:
	@echo "🚀 Starting development..."
	@npm install --silent
	@npx drizzle-kit generate
	@npx drizzle-kit migrate
	@echo "✅ Ready! Starting server on port $(PORT)"
	@npm run dev

# Clean start (kills port first)
dev-clean:
	@echo "🧹 Cleaning port $(PORT) and starting fresh..."
	@npx kill-port $(PORT) 2>/dev/null || true
	@$(MAKE) --no-print-directory dev

# Show available commands
help:
	@echo "Available commands:"
	@echo "  make dev       - Install deps, run migrations, start dev server"
	@echo "  make dev-clean - Kill port $(PORT) first, then start dev"
	@echo "  make help      - Show this help"

.DEFAULT_GOAL := dev
