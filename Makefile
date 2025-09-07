.PHONY: dev setup db migrate recurring build clean down help

help:
	@echo "🌟 Meffin Development Commands"
	@echo ""
	@echo "  dev        - Start development server (auto-setup included)"
	@echo "  migrate    - Generate migration files after schema changes"
	@echo "  setup      - Manual setup (database, schema, and dependencies)"
	@echo "  db         - Start PostgreSQL database only"
	@echo "  recurring  - Generate recurring transactions (for testing/self-hosting)"
	@echo "  build      - Build for production (with migrations)"
	@echo "  clean      - Clean build artifacts and stop services"
	@echo "  down       - Stop all services"
	@echo ""

db:
	@echo "🐘 Starting PostgreSQL database..."
	@docker-compose up -d postgres

# One-time setup for contributors
setup: db
	@echo "📦 Installing dependencies..."
	@npm install --silent
	@echo "🔄 Setting up database schema (development)..."
	@npx drizzle-kit push
	@echo "✅ Setup complete!"

# Development server (always runs setup to ensure everything works)
dev: setup
	@echo "🚀 Starting Next.js development server..."
	@npm run dev

# For maintainers: generate migration files after schema changes
migrate:
	@echo "🔄 Generating migration from schema changes..."
	@npx drizzle-kit generate
	@echo "🔄 Applying migration to local database..."
	@npx drizzle-kit migrate
	@echo "✅ Migration files created and applied!"
	@echo "📝 Don't forget to commit the new migration files!"

recurring:
	@echo "🔄 Generating recurring transactions..."
	@curl -X POST http://localhost:3000/api/cron/recurring-transactions \
		-H "Content-Type: application/json" \
		|| echo "⚠️  Make sure the app is running (make dev)"

build:
	@echo "🏗️  Building for production..."
	@npx drizzle-kit migrate && npm run build

clean:
	@echo "🧹 Cleaning up..."
	@rm -rf .next node_modules
	@docker-compose down -v

down:
	@echo "🛑 Stopping all services..."
	@docker-compose down
