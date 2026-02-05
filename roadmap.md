# Meffin Roadmap

## Completed Features

- [x] **Partner sharing** - Invite a partner to collaborate on budgets
- [x] **Annual transactions** - Support yearly recurring transactions
- [x] **Shopping lists** - Collaborative lists with price tracking

---

## Short Term (v0.2.x)

### UX Improvements
- [ ] **Swipe actions on mobile** - Swipe left/right on transactions and list items for quick edit/delete
- [ ] **Undo for deletions** - Show a toast with "Undo" button for 5 seconds after deleting items
- [ ] **Retry button on errors** - Add retry functionality when data fails to load
- [ ] **Better loading states** - Show spinners on buttons during form submissions

### Filters & Search
- [ ] **Transaction search** - Search transactions by description
- [ ] **Category filter** - Filter transactions by category
- [ ] **Amount range filter** - Filter by min/max amount
- [ ] **Date range filter** - Custom date range selection

### Data Export
- [ ] **CSV export** - Export transactions to CSV file
- [ ] **PDF report** - Generate monthly PDF report

---

## Medium Term (v0.3.x)

### Budget Goals
- [ ] **Category budgets** - Set monthly spending limits per category
- [ ] **Budget alerts** - Notification when approaching/exceeding budget
- [ ] **Budget progress bars** - Visual indicator of spending vs budget on dashboard

### Analytics & Charts
- [ ] **Spending over time** - Line chart showing expense trends
- [ ] **Category pie chart** - Visual breakdown of spending by category
- [ ] **Income vs Expenses** - Monthly comparison bar chart
- [ ] **Year-over-year comparison** - Compare spending between years

### Recurring Transactions
- [ ] **Weekly recurring** - Support for weekly transactions
- [ ] **Custom intervals** - Every X days/weeks/months
- [ ] **Skip occurrence** - Skip a single occurrence without deleting the recurring rule
- [ ] **Pause recurring** - Temporarily pause a recurring transaction

---

## Long Term (v0.4.x)

### Notifications
- [ ] **Monthly summary email** - Optional email with monthly spending recap
- [ ] **Push notifications** - Reminders for bills, budget alerts
- [ ] **Partner activity notifications** - Get notified when partner adds transactions

### Multi-currency
- [ ] **Multiple currencies** - Track accounts in different currencies
- [ ] **Currency conversion** - Automatic conversion for dashboard totals
- [ ] **Exchange rate history** - Track rates over time

### Savings Goals
- [ ] **Create savings goals** - Set target amount and deadline
- [ ] **Track progress** - Visual progress toward goals
- [ ] **Automatic allocation** - Auto-allocate income to savings goals

### Advanced Features
- [ ] **Receipt scanning** - OCR to extract amount and description from receipts
- [ ] **Bank import** - Import transactions from bank CSV/OFX files
- [ ] **Split transactions** - Split a single payment across multiple categories
- [ ] **Tags** - Add custom tags to transactions for more flexible categorization

---

## Technical Debt & Improvements

### Performance
- [ ] **Pagination** - Add pagination to transaction lists
- [ ] **Virtual scrolling** - For large transaction lists
- [ ] **Database indexes** - Add indexes for common queries

### Security
- [ ] **Cron authentication** - Add CRON_SECRET verification for scheduled jobs
- [ ] **Rate limiting** - Protect API endpoints from abuse
- [ ] **Audit log** - Track sensitive operations

### Code Quality
- [ ] **Extract shared services** - DRY up duplicated API logic
- [ ] **E2E tests** - Add Playwright tests for critical flows
- [ ] **API documentation** - OpenAPI/Swagger docs

---

## Community Suggestions

Have a feature request? Open an issue on GitHub!

---

*Last updated: February 2025*
