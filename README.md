# FinTrack — Finance Dashboard

A personal finance dashboard built as a frontend-only application with realistic mock data. Demonstrates React/Next.js fundamentals, component architecture, state management, role-based UI, and thoughtful design.

## Features

### Core
- **Dashboard Overview** — 4 KPI cards (Total Balance, Monthly Income, Expenses, Savings Rate) with month-over-month trend indicators. Includes a 6-month balance/income/expense line chart and a donut chart for spending breakdown by category.
- **Transactions** — Full transaction list with search, category filter, type filter (income/expense), sort by date or amount, and asc/desc toggle. Paginated at 10 rows per page.
- **Role-Based UI** — Switch between Admin and Viewer roles via the header dropdown. Admins can add, edit, and delete transactions. Viewers have read-only access.
- **Insights** — Auto-derived observations: highest spending category, month-over-month income/expense comparison, savings rate trend, top 3 categories with progress bars, average transaction size, and income-to-expense ratio.
- **Responsive Layout** — Desktop sidebar (220px, zinc-950) + full-width main area. On mobile, the sidebar collapses into a hamburger-triggered Sheet overlay.

### Optional Enhancements (all implemented)
- **Dark Mode** — Full dark theme via CSS variables. Persisted in `localStorage`. Toggles with Sun/Moon button in the header. Respects system preference on first load.
- **Data Persistence** — Transactions and role are persisted to `localStorage` via Zustand `persist` middleware. Data survives page refreshes.
- **CSV Export** — Download the current filtered transaction list as a `.csv` file from the Transactions page.
- **Micro-animations** — Cards and sections animate in with staggered `fade-in + slide-in-from-bottom` on each page load.

## Tech Stack

| Tool | Purpose |
|------|---------|
| Next.js 15 (App Router) | Framework, routing, server/client components |
| TypeScript | Type safety throughout |
| Tailwind CSS v4 | Utility-first styling with dark mode variants |
| shadcn/ui | Accessible component primitives |
| Recharts | LineChart (balance trend), PieChart (spending breakdown) |
| Zustand + persist | Global state with localStorage persistence |
| date-fns | Date formatting and monthly range calculation |
| Lucide React | Icons |

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/dashboard` automatically.

## How Role Switching Works

The **Role Switcher** dropdown is in the top-right of the header (next to the theme toggle):

- **Viewer** (default) — Read-only. No add/edit/delete controls shown.
- **Admin** — Full access. "Add Transaction" button + Edit/Delete actions per row appear on the Transactions page.

Role is persisted to `localStorage` and survives refresh.

## Dark Mode

Click the **Moon/Sun icon** in the header to toggle dark mode. The preference is saved to `localStorage` and respected on next visit. On first load, the system preference (`prefers-color-scheme`) is used as the default.

## CSV Export

On the Transactions page, click **Export CSV** to download the currently-filtered transaction list as a `.csv` file named `fintrack-transactions-YYYY-MM-DD.csv`.

## App Sections

| URL | Section | Description |
|-----|---------|-------------|
| `/dashboard` | Dashboard | KPI cards + charts |
| `/transactions` | Transactions | Filterable, sortable table with CSV export |
| `/insights` | Insights | Auto-derived financial observations |

## Project Structure

```
finance-dashboard/
├── app/
│   ├── layout.tsx              Root layout: ThemeProvider + Sidebar + Header
│   ├── page.tsx                Redirects to /dashboard
│   ├── globals.css             Design tokens (light + dark CSS variables)
│   ├── dashboard/page.tsx      KPI cards + charts
│   ├── transactions/page.tsx   Filters + table
│   └── insights/page.tsx       Insight cards panel
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx         Desktop nav (zinc-950, 220px)
│   │   ├── Header.tsx          Top bar: title + ThemeToggle + RoleSwitcher + mobile menu
│   │   ├── ThemeProvider.tsx   Dark/light theme context + localStorage sync
│   │   ├── ThemeToggle.tsx     Moon/Sun icon button
│   │   └── RoleSwitcher.tsx    Admin/Viewer dropdown
│   ├── dashboard/
│   │   ├── SummaryCards.tsx    4 animated KPI cards with trend indicators
│   │   ├── BalanceTrendChart.tsx   Recharts LineChart (theme-aware colors)
│   │   └── SpendingBreakdownChart.tsx  Recharts PieChart + legend
│   ├── transactions/
│   │   ├── TransactionFilters.tsx   Search + filters
│   │   ├── TransactionTable.tsx     Paginated table + CSV export + CRUD (Admin)
│   │   └── AddTransactionDialog.tsx Form dialog
│   └── insights/
│       └── InsightsPanel.tsx   Animated stat cards + category progress bars
├── lib/
│   ├── mock-data.ts            40 realistic transactions (Jan–Apr 2026)
│   ├── store.ts                Zustand store with localStorage persistence
│   └── utils.ts               formatCurrency, formatDate, monthly/category helpers
└── types/
    └── index.ts               Transaction, Category, Role, Filters types
```

## Design Decisions

- **Zustand over Redux** — Minimal boilerplate, no providers, ideal for small shared state.
- **shadcn/ui over MUI** — Owns the output HTML/classes — no style override fights.
- **CSS variable dark mode** — All color tokens are CSS vars, so `dark:` Tailwind variants switch cleanly without JS-in-CSS.
- **Persist only data, not filters** — Filters reset per session (intentional UX decision — filters are transient; data is persistent).
