# Kharcha — Smart Expense Tracker

A full-stack personal finance app to track expenses, set budgets, and get AI-powered insights. Built with Next.js 16, Neon Postgres, Clerk Auth, and Claude AI. Live at [kharcha.store](https://kharcha.store).

## Features

### Core
- **Dashboard Overview** — 4 KPI cards (Total Balance, Monthly Income, Expenses, Savings Rate) with month-over-month trend indicators. Includes a 6-month balance/income/expense line chart and a donut chart for spending breakdown by category. Always totals all your transactions, whatever the Transactions page filters are set to.
- **Transactions** — Full transaction list with search, category filter, type filter (income/expense), sort by date or amount, and asc/desc toggle. Paginated at 10 rows per page. Filtering runs in the browser, so search is instant.
- **Budgets** — Monthly limits per category, with progress bars and an alert when a budget is exceeded.
- **Recurring transactions** — Weekly, monthly or yearly items (rent, salary, subscriptions). A daily cron creates the entries that are due; "Process Due" does the same on demand. Pausing skips the paused dates, and a missed run is filled in up to 7 days back.
- **Statement import** — Paytm UPI statements and bank CSVs (signed amounts, Dr/Cr marks, or Debit/Credit columns), plus **Smart Import**, which reads CSV, Excel and PDF statements with Claude. Re-importing a statement skips the transactions already saved.
- **Insights** — Auto-derived observations: highest spending category, month-over-month income/expense comparison, savings rate trend, top 3 categories with progress bars, average transaction size, and income-to-expense ratio. **AI Insights** adds a few bullet points written by Claude from your recent transactions.
- **Role-Based UI** — Switch between Admin and Viewer roles via the header dropdown. Admins can add, edit, and delete transactions. Viewers see a read-only table.
- **Demo mode** — Signed-out visitors see a demo dataset that always ends in the current month.
- **Responsive Layout** — Desktop sidebar (220px) + full-width main area. On mobile, a bottom tab bar plus a hamburger-triggered Sheet overlay.

Amounts are stored in whole rupees: an amount with paise is rounded to the nearest rupee, and the app says so when it does.

### Enhancements
- **Dark Mode** — Full dark theme via CSS variables. Persisted in `localStorage`. Toggles with Sun/Moon button in the header.
- **Data Persistence** — Transactions, budgets and recurring items are stored per user in Neon Postgres, behind Clerk sign-in.
- **CSV Export** — Download the current filtered transaction list as a `.csv` that opens safely in Excel or Google Sheets and can be imported back into Kharcha.
- **PWA** — Installable from the browser (web manifest + service worker).
- **Micro-animations** — Cards and sections animate in with staggered `fade-in + slide-in-from-bottom` on each page load.

## Tech Stack

| Tool | Purpose |
|------|---------|
| Next.js 16 (App Router, `proxy.ts`) | Framework, routing, route handlers |
| React 19 + TypeScript | UI and type safety throughout |
| Clerk | Sign-in, sessions, per-user data |
| Neon Postgres + Drizzle ORM | Database (over HTTP with `drizzle-orm/neon-http`) |
| Vercel AI SDK + Claude Sonnet 5.5 | AI Insights and Smart Import (structured output) |
| SheetJS, unpdf | Reading Excel and PDF statements |
| Tailwind CSS v4 + shadcn/ui | Styling and accessible component primitives |
| Recharts | LineChart (balance trend), PieChart (spending breakdown) |
| Zustand | Client state (the transaction list and filters) |
| date-fns | Date formatting and monthly range calculation |
| Vitest + PGlite | Tests, including real Postgres queries in memory |

## Setup

1. Copy `.env.example` to `.env.local` and fill in the Neon `DATABASE_URL`, the Clerk keys, `ANTHROPIC_API_KEY`, and a `CRON_SECRET` (for example the output of `openssl rand -hex 32`).
2. Create the tables (drizzle-kit reads `DATABASE_URL` from the environment, not from `.env.local`):

   ```bash
   npm install
   DATABASE_URL='postgresql://…' npx drizzle-kit push
   ```

3. Run it:

   ```bash
   npm run dev     # http://localhost:3000
   npm test        # unit and route tests (no network or database needed)
   npm run lint
   ```

## Recurring Cron

`vercel.json` schedules `GET /api/recurring/process` daily at 01:00 UTC. Vercel sends `Authorization: Bearer $CRON_SECRET`, and the route refuses to run if `CRON_SECRET` isn't set, so add it to the project's environment variables in Vercel. The "Process Due" button on the Recurring page calls the same logic for the signed-in user only.

## How Role Switching Works

The **Role Switcher** dropdown is in the top-right of the header (next to the theme toggle):

- **Admin** (default) — Full access. "Add Transaction" button + Edit/Delete actions per row appear on the Transactions page.
- **Viewer** — Read-only. No add/edit/delete controls shown.

The role is a display setting only and resets on refresh.

## Dark Mode

Click the **Moon/Sun icon** in the header to toggle dark mode. The preference is saved to `localStorage` and respected on next visit.

## CSV Export

On the Transactions page, click **Export CSV** to download the currently-filtered transaction list as `kharcha-transactions-YYYY-MM-DD.csv`. Dates are written as `YYYY-MM-DD`, and a description that a spreadsheet would run as a formula is prefixed with `'`. The file can be imported back through **Import**.

## App Sections

| URL | Section | Description |
|-----|---------|-------------|
| `/dashboard` | Dashboard | KPI cards + charts (public, with demo data when signed out) |
| `/transactions` | Transactions | Filterable, sortable table, import and CSV export |
| `/budgets` | Budgets | Monthly limits per category |
| `/recurring` | Recurring | Recurring items, pause/resume, Process Due |
| `/insights` | Insights | Auto-derived observations + AI Insights |

## Project Structure

```
app/
├── (app)/                  Signed-in pages: dashboard, transactions, budgets, recurring, insights
│   └── _ai-chat/           AI Chat, switched off (a leading _ keeps it out of routing)
├── (auth)/                 Clerk sign-in and sign-up
└── api/                    Route handlers: transactions (+ bulk import), budgets, recurring (+ cron),
                            insights, ai-insights, parse-document (Smart Import)
components/                 UI by area: dashboard, transactions, budgets, recurring, insights, layout
lib/
├── db/                     Drizzle schema and Neon client
├── categories.ts           The one list of categories
├── recurring.ts            Schedule maths and the cron's processing
├── statement-import.ts     Paytm/bank CSV parsers and the CSV export
├── document-text.ts        Text from CSV, Excel and PDF uploads
├── store.ts                Zustand store (full list; writes throw on failure)
└── api.ts, money.ts, filters.ts, validation.ts, mock-data.ts, ai.ts
proxy.ts                    Clerk auth for pages and APIs (signed-out API calls get a JSON 401)
test/                       Test helpers: in-memory Postgres (PGlite), fake Anthropic provider
```

## Design Decisions

- **Zustand over Redux** — Minimal boilerplate, no providers, ideal for small shared state.
- **shadcn/ui over MUI** — Owns the output HTML/classes — no style override fights.
- **CSS variable dark mode** — All color tokens are CSS vars, so `dark:` Tailwind variants switch cleanly without JS-in-CSS.
- **Filter in the browser** — The store holds the full list, so the dashboard and the filtered table never disagree, and search doesn't wait on the network.
- **Whole rupees** — Amounts are integers in rupees; paise round to the nearest rupee.
