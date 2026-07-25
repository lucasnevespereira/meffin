# How months work

Meffin shows any month you ask for — last March, this month, next October. Months that
have already happened are stored data. Months that haven't are worked out from your
recurring transactions.

## Planning a transaction

**A bill you know is coming.** Add a transaction, set Repeats to *One-time*, and pick the
date. The date field accepts any day in any month, so a water bill due 14 October goes in
today. Navigate to October and it's there, alongside your rent and salary.

**Something recurring.** Pick any repeat other than *One-time* and choose the day of the
month. It shows up in every month from now on, up to its end date if it has one.

**Changing what a recurring transaction costs.** Edit it in the *current* month. Rent
going from 800 to 950 means opening this month's rent and changing the amount — every
future month follows. Months that have already passed keep the amount you actually paid,
because that's what happened.

**Skipping one month.** Delete that month's occurrence. The month stays empty and the
transaction carries on as normal from the next one.

**Stopping something for good.** Either set an end date, or switch it to *One-time*, which
ends the series at the month you're editing.

## Reading a future month

Future months mark themselves. The month switcher shows a **Planned** chip, and each
projected row is dashed and tagged **Planned** — one word, one meaning: this hasn't
happened yet. Planned rows have no edit or delete button, because there's nothing stored
behind them. A single **Edit in {current month}** link above the list takes you where the
change actually works.

Anything real in a future month — that October water bill — looks and behaves normally,
because it *is* a normal transaction that happens to be dated ahead.

Trends has an **Include next 6 months** toggle. A dashed vertical line marks today, so
everything to its right is projection.

Excel exports skip planned rows. An export is a record of what happened, and forecast
numbers sitting in a spreadsheet unlabelled would read as fact.

## What the forecast assumes

It repeats your most recent month forward. Fixed things — rent, salary, subscriptions —
are what it's good at. Variable spending like groceries or restaurants doesn't appear,
because there's no rule to project. A forecast month will look healthier than the month
will actually turn out.

The switcher stops 24 months out. Recurring amounts drift, and a longer projection would
imply precision the data doesn't have.

---

# How it works

## Series

A recurring transaction is a **series**. Every occurrence is a real row in `transactions`,
and they all share a `series_id`. The first occurrence lends its id to the rest.

The row with the highest `month_key` that hasn't been deleted is the **head**. The head
supplies the amount, description, category and day for every projected month after it.
That single rule is what makes "edit the current month, the future follows" true without
any versioning machinery.

Four columns carry this:

| Column | Meaning |
|---|---|
| `month_key` | `year * 12 + month`, UTC. Every row has one. |
| `series_id` | Shared by all occurrences. `NULL` for one-off transactions. |
| `end_month` | Inclusive last month. `NULL` means forever. Read from the head. |
| `voided` | A deleted occurrence. Excluded from totals, but still holds its slot. |

Month arithmetic runs on `month_key` and never on a parsed `Date`, which is what keeps
timezones and DST from moving a transaction between months.

### Why `voided` exists

Deleting a row outright would let the next materialisation pass write it straight back.
The tombstone records that the month was deliberately emptied. It also distinguishes a
deletion from a gap left by a cron run that never fired.

Delete every occurrence of a series and no live row is left, so nothing projects — that's
how deleting a recurring transaction, or an annual one, ends it entirely.

## Past, present, future

**Up to and including this month:** real rows. Reading a month writes any rows a series
still owes, up to today. It's idempotent — a partial unique index on
`(series_id, month_key)` turns a concurrent double-write into a no-op.

**This replaces the old cron.** There is no `/api/cron/recurring-transactions` any more.
If you self-host and had a scheduler hitting it, remove that job. Catch-up now happens on
read, which also repairs gaps a missed run would previously have left forever.

**After this month:** projected, never written. Projected rows carry
`source: "projected"` and an id of the form `p_<seriesId>_<monthKey>`. They can't be
edited or deleted; the API answers `400` if you try.

Projection resumes after the newest month a series has any row for, deleted ones included.
So gaps stay gaps and are never retroactively filled.

## Annual transactions

Annual is the exception: it was never materialised and still isn't. One row stands in for
every renewal, which is why an annual transaction keeps its **real id** in every year and
stays editable from any of them. Deleting it removes the whole thing, as it always has.

The one fix here: an annual transaction no longer appears in years *before* it started.
The dashboard used to match on month while ignoring the year.

## Storage

Rows are written for every month up to and including the current one, one per series per
month — the same rate the cron produced. **Projection did not reduce that.** Future months
cost nothing, but the cron never wrote future months either.

```
series_id  rows  first  last          current month = 24318
rent-jan      6  24312  24318         nothing written past today
nf-may        3  24316  24318
gym-feb       3  24313  24318
```

Three things genuinely changed:

- **Dormant accounts stop growing.** Catch-up runs on read, so an abandoned account writes
  nothing. The cron ran for every user every month regardless of whether anyone logged in.
- **Bounded series actually stop.** `3months`, `6months` and `until` were generating rows
  forever because the cron dropped `end_date` when copying. Those now end on schedule.
- **No duplicate rows from day-31 transactions.** The old cron rolled the 31st of a short
  month into the next one, missed its own dedupe check, and wrote a second row.

If storage ever does need to come down, the change is to stop materialising and project
the present too. That was deliberately not done: already-shipped mobile builds can reach
the current month and need a real row id to edit or delete, and there's no
over-the-air update path to fix them.

## Code layout

```
lib/services/budget/
  keys.ts      month-key arithmetic, day clamping (31st → 28th in February)
  project.ts   pure projection — no database, no session, no clock
  budget.ts    the IO boundary: getEntries, getRange, getMonth, materializeThrough
```

`project.ts` is where the recurrence rules live and it takes everything as an argument,
so the awkward cases are cheap to test — `npm test` covers day-31 in February and leap
years, inclusive end bounds, annual renewals, void suppression, and gap preservation.

`budget.ts` is the only module that reads transaction rows for display. **The
partner-privacy filter lives there and nowhere else** — it used to be copy-pasted across
three routes, and each new endpoint was a fresh chance to leak a partner's amounts.

Routes are thin wrappers:

| Endpoint | Notes |
|---|---|
| `GET /api/dashboard?month=&year=` | Any month, past or future. |
| `GET /api/transactions?month=&year=` | Adds `source: "actual" \| "projected"`. |
| `GET /api/transactions?annual=true` | Unchanged: one real row per annual transaction. |
| `GET /api/history?months=N&future=M` | `future` is optional and defaults to 0. |
| `POST /api/transactions` | Routes on `repeatType`: `once` writes a plain row, anything else starts a series. |

Every change is additive, so mobile builds already in the App Store keep working.

## Trying it locally

Sign in once so the account exists, then:

```bash
make seed        # or: npm run seed:demo -- you@example.com
```

That writes nine months of history plus a few things dated ahead: an annual insurance
renewal, a gym membership that runs out, flights two months out and a water bill three.
Expenses drop by about 250 a month the moment you step past today — that gap is the
everyday spending the forecast can't know about, and it's the clearest way to see why the
estimate reads high.

It replaces that account's transactions, so point it at a local database only.

## Verification

```bash
npm test                                              # projection unit tests
npx tsx --env-file=.env.local scripts/verify-projection.ts
```

`verify-projection.ts` recomputes every past `(user, month)` both ways and reports any
difference to the cent. Run it against a copy of production before migrating. Two kinds of
mismatch are expected, and both are bugs the migration fixes:

- **Bounded recurrences that never stopped.** The old cron didn't copy `end_date` onto the
  months it generated, so `3months`, `6months` and `until` all behaved like `forever`.
  After migrating they stop when they were supposed to, which to an affected user looks
  like transactions disappearing. Worth a line in the release notes.
- **Annual transactions shown before they started**, per the dashboard fix above.

The `0006` migration writes a `transactions_pre_series_backup` table before touching
anything. Drop it once the release has been stable for a few weeks.
