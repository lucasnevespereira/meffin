# Variables
NODE_ENV ?= development
PORT ?= 3000

.PHONY: help dev setup db-setup db-reset build clean install

# Default target
.DEFAULT_GOAL := help

# Show available commands
help:
	@echo "🛠️  Meffin Development Commands"
	@echo ""
	@echo "Quick Start:"
	@echo "  make setup      - Complete setup for new contributors (install + db setup)"
	@echo "  make dev        - Start development server"
	@echo ""
	@echo "Database:"
	@echo "  make db-setup   - Set up database schema (run migrations)"
	@echo "  make db-reset   - Reset database and apply fresh schema"
	@echo ""
	@echo "Other:"
	@echo "  make install    - Install dependencies only"
	@echo "  make build      - Build for production"
	@echo "  make clean      - Clean node_modules and build artifacts"
	@echo "  make help       - Show this help"

# Complete setup for new contributors
setup: install db-setup
	@echo ""
	@echo "🎉 Setup complete! Run 'make dev' to start developing."
	@echo ""

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	@npm install --silent

# Set up database (apply migrations)
db-setup:
	@echo "📊 Setting up database..."
	@if [ ! -f ".env.local" ]; then \
		echo "❌ .env.local file not found!"; \
		echo "   Please copy .env.example to .env.local and add your DATABASE_URL"; \
		exit 1; \
	fi
	@npx drizzle-kit migrate
	@echo "✅ Database setup complete!"

# Reset database (push current schema)
db-reset:
	@echo "🔄 Resetting database..."
	@npx drizzle-kit push --force
	@echo "✅ Database reset complete!"

# Start development server
dev:
	@echo "🚀 Starting development server..."
	@if [ ! -d "node_modules" ]; then \
		echo "📦 Installing dependencies first..."; \
		npm install --silent; \
	fi
	@npm run dev

# Build for production
build: install
	@echo "🏗️  Building for production..."
	@npm run build

# Clean everything
clean:
	@echo "🧹 Cleaning up..."
	@rm -rf node_modules
	@rm -rf .next
	@rm -rf dist
	@echo "✅ Clean complete!"

# Check if environment is set up
check-env:
	@if [ ! -f ".env.local" ]; then \
		echo "❌ .env.local file not found!"; \
		echo "   Please copy .env.example to .env.local and configure your environment variables"; \
		exit 1; \
	fi
	@echo "✅ Environment file found"
