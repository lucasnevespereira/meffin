<div align="center">
  <img src="public/logo.png" alt="Meffin Logo" width="120" height="120" />
  <h1>Meffin</h1>
  <p><strong>Simple, lightweight monthly budget tracking</strong></p>
  <p>Built for simplicity and self-hosting</p>
</div>


## ✨ Features

- 💰 Track income and expenses
- 🔄 Recurring transactions with flexible end dates
- 📊 Custom categories with colors
- 📱 Mobile-friendly PWA
- 🌍 Multi-language support (EN, FR)
- 🎨 Dark/Light theme
- 🏠 Self-hostable

## 🚀 Quick Start

```bash
git clone https://github.com/lucasnevespereira/meffin.git
```

```bash
cd meffin
```

```bash
cp .env.example .env.local
```

```bash
# Edit DATABASE_URL in .env.local (optional - uses Docker by default)
make dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🛠️ Commands

```bash
make dev      # Start development (auto-setup)
make migrate  # Generate migration after schema changes
make build    # Build for production
make clean    # Clean up and stop services
```

## 🏠 Self-hosting

Deploy anywhere that supports Node.js. Set your `DATABASE_URL`:

```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

Works with Neon, Supabase, Railway, or self-hosted PostgreSQL.

## 🤝 Contributing

Contributions welcome! Fork the repo and submit a PR.

1. **Fork & clone**
```bash
git checkout -b feature/your-feature
```

2. **Make changes & commit**
```bash
git commit -m "feat: your feature"
```

3. **Push & create PR**
```bash
git push origin feature/your-feature
```

## 📄 License

This project is under [MIT LICENSE](LICENSE)
