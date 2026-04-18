# High Level Design — Finance Dashboard UI

## 1. Overview

A frontend-only, single-page finance dashboard built with Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts, and Zustand. The application enables users to track income, expenses, and financial trends through an interactive and role-aware interface backed entirely by mock data.

---

## 2. Goals

| Goal | Description |
|------|-------------|
| Financial Visibility | Provide an at-a-glance view of balance, income, expenses, and savings rate |
| Transaction Management | Allow browsing, filtering, sorting, adding, editing, and deleting transactions |
| Role-Based UI | Differentiate Admin (full access) and Viewer (read-only) behavior on the frontend |
| Spending Intelligence | Surface auto-derived insights from transaction data without a backend |
| Responsiveness | Fully usable on both desktop and mobile viewports |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Next.js App Router                  │  │
│  │                                                       │  │
│  │  ┌──────────────┐   ┌────────────────────────────┐   │  │
│  │  │   Layout     │   │         Pages              │   │  │
│  │  │  (Sidebar +  │   │  /dashboard                │   │  │
│  │  │   Header)    │   │  /transactions             │   │  │
│  │  └──────────────┘   │  /insights                 │   │  │
│  │                     └────────────────────────────┘   │  │
│  │                                                       │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │              Component Layer                   │  │  │
│  │  │  Dashboard/  Transactions/  Insights/  Layout/ │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                       │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │              State Layer (Zustand)             │  │  │
│  │  │  transactions · filters · role                 │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                       │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │              Data Layer                        │  │  │
│  │  │  mock-data.ts · utils.ts · types/index.ts      │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

> No backend, no API calls, no database. All data lives in memory (Zustand store), seeded from static mock data on first load.

---

## 4. Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | Next.js 15 (App Router) | File-based routing, server components, modern React |
| Language | TypeScript | Type safety across all components and utilities |
| Styling | Tailwind CSS v4 | Utility-first, consistent design tokens |
| UI Components | shadcn/ui (Base UI) | Accessible, unstyled primitives with our own skin |
| Charts | Recharts | Composable, React-native charting |
| State Management | Zustand | Minimal boilerplate, no provider wrapping needed |
| Date Utilities | date-fns | Lightweight date formatting |
| Icons | Lucide React | Consistent icon system |

---

## 5. Project Structure

```
finance-dashboard/
│
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout: Sidebar + Header shell
│   ├── page.tsx                  # Redirect → /dashboard
│   ├── globals.css               # Design tokens (CSS variables)
│   ├── dashboard/page.tsx        # Overview: cards + charts
│   ├── transactions/page.tsx     # Transaction list + filters
│   └── insights/page.tsx        # Derived financial insights
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx           # Desktop nav (zinc-950, 220px)
│   │   ├── Header.tsx            # Top bar + mobile sheet nav
│   │   └── RoleSwitcher.tsx      # Admin / Viewer dropdown
│   │
│   ├── dashboard/
│   │   ├── SummaryCards.tsx      # 4 KPI cards with trend indicators
│   │   ├── BalanceTrendChart.tsx # 6-month line chart (Balance/Income/Expense)
│   │   └── SpendingBreakdownChart.tsx  # Donut chart by category
│   │
│   ├── transactions/
│   │   ├── TransactionFilters.tsx  # Search + category/type/sort filters
│   │   ├── TransactionTable.tsx    # Paginated table with CRUD (Admin)
│   │   └── AddTransactionDialog.tsx # Form dialog (Admin only)
│   │
│   └── insights/
│       └── InsightsPanel.tsx     # 6 stat cards + top-3 category bars
│
├── lib/
│   ├── mock-data.ts              # 40 seeded transactions (Jan–Apr 2026)
│   ├── store.ts                  # Zustand store (transactions, role, filters)
│   └── utils.ts                  # formatCurrency, getMonthlyData, etc.
│
└── types/
    └── index.ts                  # Transaction, Role, Category, Filters types
```

---

## 6. Data Model

### Transaction
```ts
interface Transaction {
  id: string;                 // UUID
  date: string;               // ISO 8601
  amount: number;             // Positive float
  category: Category;         // Enum (10 values)
  type: 'income' | 'expense';
  description: string;
}
```

### Filters
```ts
interface Filters {
  search: string;
  category: Category | 'all';
  type: 'income' | 'expense' | 'all';
  sortBy: 'date' | 'amount';
  sortOrder: 'asc' | 'desc';
}
```

### Role
```ts
type Role = 'admin' | 'viewer';
```

---

## 7. State Management

Zustand store — single source of truth for all mutable application state.

```
useFinanceStore
│
├── transactions: Transaction[]     ← seeded from mock-data on init
├── role: Role                      ← default: 'viewer'
├── filters: Filters                ← default: all/all/date/desc
│
├── setRole(role)                   ← switches Admin/Viewer mode
├── setFilter(key, value)           ← updates any filter key
│
├── addTransaction(data)            ← generates id, appends
├── updateTransaction(id, patch)    ← merges partial update
└── deleteTransaction(id)           ← removes by id
```

State is **in-memory only** — refreshing the page resets to mock data.  
_(Optional enhancement: localStorage persistence via Zustand middleware)_

---

## 8. Role-Based UI

Roles are simulated entirely on the frontend. No authentication.

| Capability | Admin | Viewer |
|-----------|-------|--------|
| View dashboard | ✓ | ✓ |
| View transactions | ✓ | ✓ |
| View insights | ✓ | ✓ |
| Filter / search | ✓ | ✓ |
| Add transaction | ✓ | — |
| Edit transaction | ✓ | — |
| Delete transaction | ✓ | — |

The role is switched via a dropdown in the Header. The `TransactionTable` reads `role` from the Zustand store and conditionally renders the Add/Edit/Delete controls.

---

## 9. Pages & Components

### /dashboard
```
SummaryCards (x4)
  ├── Total Balance       (all-time net)
  ├── Monthly Income      (current month + MoM trend %)
  ├── Monthly Expenses    (current month + MoM trend %)
  └── Savings Rate        (current month + MoM delta pp)

BalanceTrendChart
  └── Line chart: Balance · Income · Expenses (last 6 months)

SpendingBreakdownChart
  └── Donut chart + legend (expenses by category)
```

### /transactions
```
TransactionFilters
  ├── Search (description / category)
  ├── Category select
  ├── Type select (income / expense / all)
  ├── Sort by (date / amount)
  └── Sort order toggle + Reset

TransactionTable
  ├── Paginated (10 rows/page)
  ├── Columns: Date · Description · Category · Type · Amount · [Actions]
  └── Admin actions: Edit dialog · Delete
```

### /insights
```
InsightsPanel
  ├── Top Expense Category
  ├── Income This Month    (+ MoM change)
  ├── Expenses This Month  (+ MoM change)
  ├── Savings Rate         (+ MoM delta)
  ├── Avg Transaction Size
  ├── Income / Expense Ratio
  └── Top 3 Expense Categories (progress bars)
```

---

## 10. Computed Utilities (lib/utils.ts)

| Function | Input | Output |
|----------|-------|--------|
| `formatCurrency(n)` | number | `$1,234.56` string |
| `formatDate(iso)` | ISO string | `Mar 15, 2026` |
| `getTotalIncome(txs)` | Transaction[] | sum of income amounts |
| `getTotalExpenses(txs)` | Transaction[] | sum of expense amounts |
| `getBalance(txs)` | Transaction[] | income − expenses |
| `getMonthlyData(txs)` | Transaction[] | `[{month, income, expenses, balance}]` last 6 months |
| `getCategoryBreakdown(txs)` | Transaction[] | `[{category, total, percentage}]` sorted desc |

---

## 11. Responsiveness

| Breakpoint | Layout |
|-----------|--------|
| `< lg` (mobile/tablet) | Sidebar hidden, hamburger menu → Sheet overlay |
| `≥ lg` (desktop) | Fixed 220px sidebar, scrollable main content |
| Cards grid | `1 col → 2 col (sm) → 4 col (xl)` |
| Insights grid | `1 col → 3 col (md)` |
| Transaction table | Horizontal scroll on overflow |

---

## 12. Design System

| Token | Value |
|-------|-------|
| Font | Geist (sans) + Geist Mono |
| Background | `zinc-50` (`#fafafa`) |
| Card surface | `white` with `border-zinc-200/80` |
| Primary text | `zinc-900` |
| Muted text | `zinc-400` |
| Sidebar | `zinc-950` |
| Income accent | `emerald-600` |
| Expense accent | `rose-500` |
| Border radius | `0.5rem` (8px) |
| Primary button | `zinc-900` bg, white text |

---

## 13. Key Design Decisions

**Why Zustand over Redux / Context?**  
No boilerplate, no providers, direct hook access anywhere. Ideal for a small dashboard with shared but simple state.

**Why no backend?**  
The assignment explicitly allows static/mock data. Adding a backend would introduce unnecessary scope — all derivable insights are computed client-side from the in-memory store.

**Why shadcn/ui over MUI or Chakra?**  
shadcn gives us the exact HTML/class output we need — no style override battles. Every component is owned code, not a black box.

**Why no page-level loading states?**  
All data is synchronous (in-memory store). There's no async latency to hide.

**Why role stored in Zustand (not URL/cookie)?**  
It's a demo toggle — not a real session. Zustand is the right scope: persists across navigation, resets on page refresh, trivial to read anywhere.

---

## 14. Potential Extensions

| Feature | Approach |
|---------|----------|
| Dark mode | Add `.dark` class toggle to `<html>`, CSS variables already scoped |
| Data persistence | Zustand `persist` middleware with `localStorage` |
| Mock API | `msw` (Mock Service Worker) to intercept fetch calls |
| CSV export | `json2csv` or manual Blob + anchor download |
| Advanced filtering | Date range picker, multi-select categories |
| Real auth | NextAuth.js / Clerk with actual session-based roles |
| Charts dark mode | Pass `stroke` / `fill` from CSS variables |
