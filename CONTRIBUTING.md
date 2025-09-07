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

3. **Start developing**
   ```bash
   make dev
   ```
   
   (This automatically sets up everything you need!)

That's it! The app should be running at http://localhost:3000

## What `make dev` does

- Starts Docker PostgreSQL automatically
- Installs all dependencies (if needed)
- Sets up database schema using Drizzle
- Starts the development server

**No manual setup needed!** Everything is automated with one command.

## Available Commands

```bash
make dev        # Start development server (auto-setup included)
make migrate    # Generate migration after schema changes (maintainers only)
make build      # Build for production
make clean      # Clean up and stop all services
make down       # Stop services only
```

## Database Setup

**For Contributors:** Nothing to do! `make dev` handles everything with Docker.

**For Maintainers with external DB:** Edit `.env.local`:
```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

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

## Making Database Changes (Maintainers)

If you need to modify the database schema:

1. Update `lib/schema.ts`
2. Generate migration: `make migrate`
3. Commit the new migration files

**For Contributors:** You don't need to worry about this - just use `make dev`!

## Troubleshooting

**Database issues?**
```bash
make clean    # Stops services and removes containers
make setup    # Fresh setup
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
