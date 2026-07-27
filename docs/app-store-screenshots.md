# App Store screenshot accounts

Use the dedicated seed instead of a personal account. It creates a French and an
English household, each with a generic partner, twelve months of realistic history,
recurring transactions, planned expenses, custom categories, and shared lists.

## Safety

The seed resets only these reserved accounts:

- `screenshots-en@demo.meffin.app`
- `screenshots-en-partner@demo.meffin.app`
- `screenshots-fr@demo.meffin.app`
- `screenshots-fr-partner@demo.meffin.app`

It refuses remote databases by default. Use a dedicated local, preview, or staging
database—never the production database.

## Run it

Add a password of at least eight characters to `.env.local`:

```dotenv
SCREENSHOT_SEED_PASSWORD=replace-with-a-private-password
```

Preview the fixture without touching the database:

```bash
pnpm run seed:screenshots -- --dry-run
```

Seed both languages locally:

```bash
pnpm run db:migrate
pnpm run seed:screenshots
```

Seed only one language:

```bash
pnpm run seed:screenshots -- --locale fr
pnpm run seed:screenshots -- --locale en
```

For a dedicated remote preview database, explicitly opt in from `.env.local`:

```dotenv
SCREENSHOT_SEED_ALLOW_REMOTE=true
```

The primary login emails are `screenshots-fr@demo.meffin.app` and
`screenshots-en@demo.meffin.app`. Both use `SCREENSHOT_SEED_PASSWORD`.

## Capture checklist

Capture the same seven states in French and English:

1. Dashboard — monthly overview
2. Transactions — income, expenses, and net balance
3. Trends — history and six-month forecast
4. Planner — upcoming recurring and planned expenses
5. Shared lists — Lisbon trip
6. Partner — connected household
7. Categories — default and custom categories

Before each language:

1. Set the app language.
2. Sign into the matching screenshot account.
3. Keep the same month, device, appearance, and capture order.
4. Hide simulator controls and any development overlays.
