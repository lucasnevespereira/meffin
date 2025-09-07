# Meffin 💰

Simple, lightweight monthly budget tracking. Built for simplicity and self-hosting.

## ✨ Features

- 💰 Track income and expenses
- 🔄 Recurring transactions with flexible end dates  
- 📊 Custom categories with colors
- 📱 Mobile-friendly PWA
- 🌍 Multi-language support
- 🏠 Self-hostable

## 🚀 Quick Start

**For Contributors:**
```bash
make dev      # One command does everything!
```

**For Self-hosting:**
```bash
# Copy and configure environment
cp .env.example .env.local
# Edit DATABASE_URL in .env.local

# Setup and run
make setup
make dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🛠️ Available Commands

```bash
make dev      # Start development (auto-setup included)
make migrate  # Generate migration after schema changes  
make build    # Build for production
make clean    # Clean up and stop services
```

## 🏠 Self-hosting

Deploy anywhere that supports Node.js. Just set your `DATABASE_URL` environment variable:

```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

Works with any PostgreSQL database (Neon, Supabase, Railway, self-hosted).

## 🤝 Contributing

Want to contribute? Check out [CONTRIBUTING.md](CONTRIBUTING.md) for the full development setup guide.

## 📄 License

MIT - Use this project however you want.
