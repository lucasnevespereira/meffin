.PHONY: dev setup db migrate seed build clean down help

help:
	@echo "🌟 Meffin Development Commands"
	@echo ""
	@echo "  dev        - Start development server (auto-setup included)"
	@echo "  migrate    - Generate migration files after schema changes"
	@echo "  setup      - Manual setup (database, schema, and dependencies)"
	@echo "  db         - Start PostgreSQL database only"
	@echo "  seed       - Fill your local account with example transactions"
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
	@pnpm install --frozen-lockfile
	@echo "🔄 Setting up database schema..."
	@pnpm exec drizzle-kit migrate
	@echo "✅ Setup complete!"

# Development server (always runs setup to ensure everything works)
dev: setup
	@echo "🚀 Starting Next.js development server..."
	@pnpm run dev


seed:
	@echo "🌱 Seeding example transactions..."
	@pnpm run seed:demo

build:
	@echo "🏗️  Building for production..."
	@pnpm exec drizzle-kit migrate && pnpm run build

clean:
	@echo "🧹 Cleaning up..."
	@rm -rf .next node_modules
	@docker-compose down -v

down:
	@echo "🛑 Stopping all services..."
	@docker-compose down
