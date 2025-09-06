# Contributing to Meffin

Welcome! We're excited you want to contribute to Meffin. This guide will get you up and running in minutes.

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/meffin.git
   cd meffin
   ```

2. **Set up your environment**
   ```bash
   cp .env.example .env.local
   ```

   Then add your PostgreSQL database URL to `.env.local`:
   ```bash
   DATABASE_URL="postgresql://username:password@localhost:5432/meffin_dev"
   ```

3. **One command setup**
   ```bash
   make setup
   ```

4. **Start developing**
   ```bash
   make dev
   ```

That's it! The app should be running at http://localhost:3000

## What `make setup` does

- Installs all dependencies
- Applies database migrations to set up the schema
- Verifies everything is working

## Available Commands

```bash
make setup      # Complete setup for new contributors
make dev        # Start development server
make db-setup   # Set up database schema only
make db-reset   # Reset database (if needed)
make build      # Build for production
make clean      # Clean node_modules and build artifacts
```

## Database Requirements

You need a PostgreSQL database. You can use:

- **Local PostgreSQL**: Install locally and create a database
- **Docker**: `docker run --name postgres -e POSTGRES_PASSWORD=password -d -p 5432:5432 postgres`
- **Cloud**: Neon, Supabase, Railway, etc.

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Better-Auth
- **UI**: shadcn/ui, Tailwind CSS

## Development Workflow

1. Create a branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test locally: `make dev`
4. Commit: `git commit -m "feat: your feature"`
5. Push: `git push origin feature/your-feature`
6. Create a Pull Request

## Project Structure

```
meffin/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized pages
│   │   ├── (dashboard)/   # Dashboard pages
│   │   └── (auth)/        # Auth pages
│   └── api/               # API routes
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── forms/            # Form components
│   └── dashboard/        # Dashboard-specific components
├── lib/                  # Utilities and configurations
├── locales/             # i18n translations
├── migrations/          # Database migrations
└── types/               # TypeScript type definitions
```

## Making Database Changes

If you need to modify the database schema:

1. Update `lib/schema.ts`
2. Generate migration: `npx drizzle-kit generate`
3. Apply migration: `npx drizzle-kit migrate`

## Troubleshooting

**Migration errors?**
```bash
make db-reset  # Resets database to current schema
```

**Port already in use?**
```bash
npx kill-port 3000
make dev
```

**Dependencies issues?**
```bash
make clean
make setup
```

## Need Help?

- Check existing [Issues](https://github.com/yourusername/meffin/issues)
- Create a new issue if you find a bug

## Code Style

We use:
- **ESLint** and **Prettier** for code formatting
- **TypeScript** for type safety
- **Conventional Commits** for commit messages


## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thanks for contributing! 🎉
