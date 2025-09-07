<div align="center">
  <img src="public/logo.png" alt="Meffin Logo" width="120" height="120" />
  <h1>Meffin</h1>
  <p><strong>Simple, lightweight monthly budget tracking</strong></p>
  <p>Built for simplicity and self-hosting</p>
  
  <p>
    <a href="https://github.com/lucasnevespereira/meffin/actions">
      <img alt="GitHub Actions" src="https://img.shields.io/github/actions/workflow/status/lucasnevespereira/meffin/ci.yml?branch=main&style=flat-square&logo=github" />
    </a>
    <a href="https://github.com/lucasnevespereira/meffin/releases">
      <img alt="GitHub release" src="https://img.shields.io/github/v/release/lucasnevespereira/meffin?style=flat-square&logo=github" />
    </a>
    <a href="https://github.com/lucasnevespereira/meffin/blob/main/LICENSE">
      <img alt="License" src="https://img.shields.io/github/license/lucasnevespereira/meffin?style=flat-square" />
    </a>
    <a href="https://github.com/lucasnevespereira/meffin/stargazers">
      <img alt="GitHub stars" src="https://img.shields.io/github/stars/lucasnevespereira/meffin?style=flat-square&logo=github" />
    </a>
    <a href="https://github.com/lucasnevespereira/meffin/network/members">
      <img alt="GitHub forks" src="https://img.shields.io/github/forks/lucasnevespereira/meffin?style=flat-square&logo=github" />
    </a>
  </p>
  
  <p>
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-features">Features</a> •
    <a href="#-demo">Demo</a> •
    <a href="#-self-hosting">Self-hosting</a> •
    <a href="#-contributing">Contributing</a>
  </p>
</div>

---

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
cd meffin
cp .env.example .env.local
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

Contributions welcome! Fork, make changes, and submit a PR.

```bash
git checkout -b feature/your-feature
# Make changes
git commit -m "feat: your feature"  
# Submit PR
```

## 📄 License

[MIT](LICENSE)
