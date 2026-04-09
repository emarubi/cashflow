# Cashflow

Web application for managing unpaid invoice dunning — a functional clone of Upflow.

---

## Tech Stack

| Layer          | Technology                             |
| -------------- | -------------------------------------- |
| Backend        | Node.js, Express, TypeScript           |
| API            | Apollo Server (GraphQL)                |
| Database       | PostgreSQL                             |
| Cache & Queues | Redis, BullMQ                          |
| Frontend       | React, TypeScript, Apollo Client       |
| Styling        | Tailwind CSS                           |
| Global State   | React Context                          |
| i18n           | react-i18next (FR + EN)                |
| Tests          | Jest, Supertest, React Testing Library |
| Local Infra    | Docker Compose                         |

---

## Build Status

### ✅ Done

| Area                  | What was built                                                                                                                                                                                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Monorepo**          | pnpm workspaces, root `package.json`, `pnpm-workspace.yaml`                                                                                                                                                                                                                            |
| **Docker**            | `docker-compose.yml` — postgres:16-alpine (port **5433**), redis:7-alpine (port **6380**), init script creates `cashflow_test` DB                                                                                                                                                      |
| **Backend scaffold**  | `packages/backend/` — `tsconfig.json` (strict + `@` path aliases), `package.json`, `.env.example`                                                                                                                                                                                      |
| **Frontend scaffold** | `packages/frontend/` — `tsconfig.json` (strict, react-jsx), `vite.config.ts` (React plugin, `@` alias, `/graphql` proxy to **4040**, dev port **3333**), `index.html`, `src/main.tsx`                                                                                                  |
| **Migrations**        | 12 migrations via `db-migrate` in `src/db/migrations/sqls/` — all tables + all indexes including the two critical partial indexes (`idx_invoices_unpaid`, `idx_executions_next_run`)                                                                                                   |
| **Seeds**             | 12 seeders in `src/db/seeds/` — 3 companies, 10 users, 7 workflows, 22 actions, 850 debtors, 1 550 invoices, 767 executions, 396 action events, 788 payments, 415 bank transactions                                                                                                    |
| **DB pool**           | `src/db/pool.ts` — `pg.Pool` singleton (max 20 connections)                                                                                                                                                                                                                            |
| **Auth**              | `src/auth/` — JWT sign/verify (15 min access + 7 day refresh), Express middleware, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`                                                                                                                                       |
| **Redis cache**       | `src/cache/redis.ts` — ioredis singleton + BullMQ-compatible factory; `src/cache/dashboard.ts` — get/set/invalidate with 5 min TTL                                                                                                                                                     |
| **GraphQL schema**    | `@/graphql/schema.graphql` — full SDL: 3 scalars, 13 enums, 13 domain types, 6 cursor-based connection types, Dashboard type, 13 queries, 8 mutations                                                                                                                                  |
| **DataLoaders**       | `@/graphql/dataloaders.ts` — 14 loaders (all per-request, scoped to `companyId`): userById, debtorById, invoiceById, workflowById, actionById, emailTemplateById, executionById, executionByInvoiceId, actionsByWorkflowId, actionEventsByExecutionId, paymentById, invoicesByDebtorId, creditNoteById, creditNotesByInvoiceId |
| **Services**          | 11 service files in `@/graphql/services/` — all SQL lives here, all queries scoped to `company_id`                                                                                                                                                                                     |
| **Resolvers**         | 13 resolver files in `@/graphql/resolvers/` + scalar definitions — thin layer, delegates to services, uses DataLoaders for relations                                                                                                                                                   |
| **Credit notes**      | New `credit_notes` table (migration `20260409000001`), `CreditNoteService`, `creditNoteResolvers` — full CRUD-style support for credit notes with debtor + invoice relations                                                                                                           |
| **Payments filter**   | `PaymentsFilterInput` extended with `invoiceId` to support fetching payments scoped to a single invoice                                                                                                                                                                                |
| **BullMQ queue**      | `src/queues/dunning.queue.ts` — `dunning-queue`, 3 attempts with exponential backoff                                                                                                                                                                                                   |
| **BullMQ worker**     | `src/queues/dunning.worker.ts` — idempotency → invoice lock → pause-if-paid → log → insert event → advance execution → invalidate cache                                                                                                                                                |
| **Scheduler**         | `src/queues/dunning.scheduler.ts` — polls `executions` every 60s, enqueues with 0–5 min jitter                                                                                                                                                                                         |
| **Express server**    | `src/index.ts` — Express + Apollo Server v4 (`expressMiddleware`), auth middleware, health endpoint, scheduler + worker startup                                                                                                                                                        |

### 🔲 To Do — Backend

| Area      | What needs to be built                                                                                          |
| --------- | --------------------------------------------------------------------------------------------------------------- |
| **Tests** | Unit tests for resolvers and worker; integration tests for auth endpoints (`tests/unit/`, `tests/integration/`) |

### ✅ Done — Frontend

| Area              | What was built                                                                                                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tailwind CSS**  | `tailwind.config.js` + `postcss.config.js` + `src/index.css` — custom sidebar color tokens                                                                                                           |
| **Apollo Client** | `@/graphql/client.ts` — authLink (Bearer token), errorLink (redirect on UNAUTHENTICATED), InMemoryCache with cursor-based pagination policies                                                        |
| **i18n**          | `src/i18n.ts` — react-i18next init, default lang `fr`, persisted to `localStorage`; `fr.json` + `en.json` populated with nav + auth + dashboard keys                                                 |
| **AuthContext**   | `src/contexts/AuthContext.tsx` — `login()` calls GraphQL mutation, JWT decoded client-side for `companySlug`; state + localStorage persisted (`cashflow_token`, `cashflow_user`, `cashflow_company`) |
| **UIContext**     | `src/contexts/UIContext.tsx` — `language`, `setLanguage` (persisted), `sidebarOpen`                                                                                                                  |
| **Router**        | `src/App.tsx` — `createBrowserRouter`, all 10 routes under `/:companySlug/*`, unauthenticated redirect to `/login`                                                                                   |
| **Layout**        | `src/components/Layout/` — auth guard + Sidebar + Outlet                                                                                                                                             |
| **Sidebar**       | `src/components/Layout/Sidebar.tsx` — icon-only dark navy (~56px), inline SVGs, NavLink active state with blue left border, user avatar initials                                                     |
| **Login page**    | `src/pages/Login/` — company slug + email + password form, error display                                                                                                                             |
| **Dashboard**     | `src/pages/Dashboard/` — full implementation: KPI cards, outstanding breakdown, DSO + risk rate trend cards with sparkline bar charts (Recharts), top debtors list, aging balance chart              |
| **Page stubs**    | Invoices, Actions, Payments, Bank — scaffolded, ready to implement                                                                                                                                   |
| **Workflows list** | `src/pages/Workflows/` — paginated table with type badge, metrics (customers, actions, open rate, outstanding, DSO) |
| **Workflow detail** | `src/pages/Workflows/WorkflowDetail/` — editable title, settings card (min delay, reply-to, first action logic), analytics date filter, action sequence section with per-action stats |
| **Customers list** | `src/pages/Customers/` — paginated table with search + debounce, "Add customers" dropdown (create/import/history), rating badge, assigned user, workflow, outstanding amount, total footer |
| **Customer detail** | `src/pages/Customers/CustomerDetail/` — two-column layout: info card (outstanding, avg delay, last contacted, assigned users, workflow + pause), group entities card, payment method card (with sub-tabs); right panel tabs: Invoices, Payments, Credit Notes, Contacts, Timeline, Details |
| **i18n (customers)** | ~50 keys added to `fr.json` + `en.json` covering both pages |
| **GraphQL queries** | `customers.ts`, `customer.ts`, `customerInvoices.ts`, `customerPayments.ts`, `customerTimeline.ts` |
| **Hooks** | `useDebtors`, `useDebtor`, `useDebtorInvoices`, `useDebtorPayments`, `useDebtorTimeline` |
| **Backend extensions** | `Debtor` type: `outstandingAmount`, `avgPaymentDelayDays`, `lastContactedAt`; `ActionEventsFilterInput`: `debtorId` filter |
| **Invoices list** | `src/pages/Invoices/` — two-tab page (Invoices / Credit Notes); invoice table with Number (→ detail), Customer (→ customer detail), Status badge, Issue date, Due date, Total, Outstanding; credit notes table with Number (→ detail), Source, Customer (→ customer detail), Currency, Issue date, Title, Applied to (→ invoice or "Apply to invoice" button), Total; filter panel (Status checkboxes, Currency) with active chip dismissal |
| **Invoice detail** | `src/pages/Invoices/InvoiceDetail/` — two-column layout (same pattern as CustomerDetail): left card with amounts, dates, customer link, assigned user, workflow, promise-to-pay, custom fields; right panel with Payments & Credit Notes table and Invoice Timeline (action events with channel icon, result badge, metadata) |
| **Credit note detail** | `src/pages/Invoices/CreditNoteDetail/` — two-column layout: left with info card (customer, title, issue date, external status, amounts, PDF download) + custom fields card; right with Applied Invoices table + Refunds table |
| **GraphQL queries (invoices)** | `invoices.ts`, `invoice.ts`, `invoicePayments.ts`, `creditNotes.ts`, `creditNote.ts` |
| **Hooks (invoices)** | `useInvoices`, `useInvoice`, `useInvoicePayments`, `useCreditNotes`, `useCreditNote` |
| **Routes** | Added `/:slug/invoices/:id` (invoice detail) and `/:slug/invoices/credit-notes/:id` (credit note detail) |
| **i18n (invoices)** | ~60 keys added per locale covering invoices, credit notes, filter labels, detail page labels |

### 🔲 To Do — Frontend

| Area                  | What needs to be built                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Actions**           | `src/pages/Actions/` — To Do / All views, action detail with pre-filled email, send/pause/ignore               |
| **Payments**          | `src/pages/Payments/` — paginated list with filters (status, customer)                                         |
| **Bank**              | `src/pages/Bank/` — transaction list, reconciliation suggestions, manual apply                                 |
| **GraphQL mutations** | `@/graphql/mutations/` — pauseExecution, resumeExecution, createWorkflow, applyBankTransaction                 |
| **Tests**             | RTL tests for key components and hooks                                                                         |

---

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [Docker](https://www.docker.com/) and Docker Compose
- [pnpm](https://pnpm.io/) >= 9

---

## Installation

```bash
# Clone the repo
git clone https://github.com/ton-user/cashflow.git
cd cashflow

# Install dependencies (all packages)
pnpm install

# Copy environment variables
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env
```

---

## Getting Started

### 1. Start the infrastructure (Postgres + Redis)

```bash
docker-compose up -d
```

> Ports are remapped to avoid conflicts: Postgres → **5433**, Redis → **6380**

Verify that services are running:

```bash
docker-compose ps
```

### 2. Initialize the database

```bash
cd packages/backend

# Apply migrations
pnpm migrate:up

# Seed with test data
pnpm seed
```

### 3. Start the backend

```bash
# From packages/backend
pnpm dev
```

The GraphQL API will be available at: http://localhost:4040/graphql

### 4. Start the frontend

```bash
# From packages/frontend
pnpm dev
```

The application will be available at: http://localhost:3333

---

## Demo Accounts

Three companies are available after seeding:

### Open Demo Inc. — B2B SaaS

| Field    | Value                           |
| -------- | ------------------------------- |
| URL      | http://localhost:3333/open-demo |
| Email    | john.doe@open-demo.com          |
| Password | demo1234                        |

### Acme Finance — Financial Services

| Field    | Value                              |
| -------- | ---------------------------------- |
| URL      | http://localhost:3333/acme-finance |
| Email    | jane.smith@acme-finance.com        |
| Password | demo1234                           |

### Nord Supply — Distribution

| Field    | Value                             |
| -------- | --------------------------------- |
| URL      | http://localhost:3333/nord-supply |
| Email    | marc.dupont@nord-supply.com       |
| Password | demo1234                          |

**Seed data volumes:**

| Company        | Debtors | Invoices | Executions | Payments | Bank Txns |
| -------------- | ------- | -------- | ---------- | -------- | --------- |
| Open Demo Inc. | 500     | 850      | 417        | 435      | 220       |
| Acme Finance   | 200     | 400      | 200        | 206      | 110       |
| Nord Supply    | 150     | 300      | 150        | 147      | 85        |

---

## Project Structure

```
cashflow/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── auth/                 # ✅ JWT helpers, middleware, login/refresh/logout routes
│   │   │   │   ├── types.ts
│   │   │   │   ├── jwt.ts
│   │   │   │   ├── middleware.ts
│   │   │   │   └── routes.ts
│   │   │   ├── graphql/              # ✅ schema SDL, resolvers, services, dataloaders
│   │   │   │   ├── schema.graphql
│   │   │   │   ├── context.ts
│   │   │   │   ├── dataloaders.ts    # 14 DataLoaders, all per-request + tenant-scoped
│   │   │   │   ├── resolvers/        # 13 resolver files + scalars + index
│   │   │   │   └── services/         # 11 service files (all SQL here)
│   │   │   ├── db/
│   │   │   │   ├── pool.ts           # ✅ pg.Pool singleton
│   │   │   │   ├── migrations/       # ✅ 13 migrations (db-migrate, SQL files)
│   │   │   │   └── seeds/            # ✅ 12 seeders (faker, batch inserts)
│   │   │   ├── queues/               # ✅ BullMQ dunning queue, worker, scheduler
│   │   │   │   ├── dunning.queue.ts
│   │   │   │   ├── dunning.worker.ts
│   │   │   │   └── dunning.scheduler.ts
│   │   │   ├── cache/                # ✅ Redis client, KPI cache helpers
│   │   │   │   ├── redis.ts
│   │   │   │   └── dashboard.ts
│   │   │   └── index.ts              # ✅ Express + Apollo Server v4 bootstrap
│   │   ├── tests/
│   │   │   ├── unit/                 # [TODO]
│   │   │   └── integration/          # [TODO]
│   │   ├── register-paths.js         # ✅ runtime path alias resolver (tsconfig-paths)
│   │   ├── database.json             # ✅ db-migrate config
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   └── Layout/           # ✅ Layout (auth guard + Outlet), Sidebar (icon-only dark nav)
│       │   ├── pages/
│       │   │   ├── Login/            # ✅ login form (slug + email + password)
│       │   │   ├── Dashboard/        # ✅ KPIs, outstanding, DSO, risk rate, debtors, aging balance
│       │   │   ├── Workflows/        # ✅ list table + WorkflowDetail/ (settings, analytics, action sequence)
│       │   │   ├── Customers/        # ✅ paginated list with search + CustomerDetail/ (6-tab detail view)
│       │   │   ├── Invoices/         # ✅ list (Invoices + Credit Notes tabs, filter panel)
│       │   │   │   ├── InvoiceDetail/    # ✅ two-column detail (info, payments, timeline)
│       │   │   │   └── CreditNoteDetail/ # ✅ two-column detail (info, applied invoices, refunds)
│       │   │   ├── Actions/          # stub
│       │   │   ├── Payments/         # stub
│       │   │   └── Bank/             # stub
│       │   ├── contexts/
│       │   │   ├── AuthContext.tsx   # ✅ login/logout, JWT decode, localStorage
│       │   │   └── UIContext.tsx     # ✅ language, sidebarOpen
│       │   ├── graphql/
│       │   │   ├── client.ts         # ✅ ApolloClient, authLink, errorLink
│       │   │   └── queries/          # ✅ dashboard, workflows, workflow, workflowActionStats,
│       │   │                         #    customers, customer, customerInvoices,
│       │   │                         #    customerPayments, customerTimeline
│       │   │                         #    invoices, invoice, invoicePayments,
│       │   │                         #    creditNotes, creditNote
│       │   ├── hooks/                # ✅ useDashboard, useWorkflows, useWorkflow,
│       │   │                         #    useWorkflowActionStats, useUpdateWorkflow,
│       │   │                         #    useDebtors, useDebtor, useDebtorInvoices,
│       │   │                         #    useDebtorPayments, useDebtorTimeline,
│       │   │                         #    useInvoices, useInvoice, useInvoicePayments,
│       │   │                         #    useCreditNotes, useCreditNote
│       │   ├── locales/              # ✅ fr.json + en.json (nav + auth + dashboard + workflows + customers + invoices)
│       │   ├── i18n.ts               # ✅ react-i18next init
│       │   └── App.tsx               # ✅ createBrowserRouter, 12 routes (incl. invoice + credit note detail)
│       ├── index.html                # ✅
│       ├── tailwind.config.js        # ✅ custom sidebar color tokens
│       ├── postcss.config.js         # ✅
│       ├── vite.config.ts            # ✅ React plugin, @ alias, /graphql proxy → 4040, port 3333
│       ├── package.json
│       └── tsconfig.json
│
├── docker/
│   └── init-db.sh                    # ✅ creates cashflow_test DB
├── docker-compose.yml                # ✅ postgres:5433, redis:6380
├── pnpm-workspace.yaml               # ✅
├── PRD.md                            # Product Requirements Document
├── CLAUDE.md                         # Guide for Claude Code
└── README.md
```

---

## Migration Commands

```bash
cd packages/backend

# Apply all pending migrations
pnpm migrate:up

# Roll back last migration
pnpm migrate:down

# Create a new migration (generates SQL stub files)
pnpm migrate:create <migration-name>
```

Migrations live in `src/db/migrations/sqls/` as separate `.up.sql` / `.down.sql` files.

---

## Application Pages

| Route                  | Description                          |
| ---------------------- | ------------------------------------ |
| `/:slug`               | Company login page                   |
| `/:slug/dashboard`     | KPIs, DSO, risk rate, aging balance  |
| `/:slug/workflows`     | Workflow list and configuration      |
| `/:slug/workflows/:id` | Workflow detail with its actions     |
| `/:slug/customers`     | Debtor customer list                 |
| `/:slug/customers/:id` | Customer detail                      |
| `/:slug/invoices`                     | Invoice list (Invoices + Credit Notes tabs, filter panel) |
| `/:slug/invoices/:id`                 | Invoice detail (info, payments, timeline)                 |
| `/:slug/invoices/credit-notes/:id`    | Credit note detail (info, applied invoices, refunds)      |
| `/:slug/actions`       | Actions to process (To Do)           |
| `/:slug/emails`        | Sent email history                   |
| `/:slug/payments`      | Payment list                         |
| `/:slug/bank`          | Bank transactions and reconciliation |

---

## Queue Architecture

The automated dunning system works as follows:

1. **Scheduler** (every 60s): fetches `executions` where `next_run_at <= NOW()` and enqueues them in BullMQ with a random jitter of 0 to 5 minutes
2. **Worker**: checks idempotency in `action_events` → verifies invoice is still unpaid → simulates send → inserts `action_events` → advances execution to next step
3. **Dead-letter queue**: failed jobs after 5 attempts are logged and the execution is marked `failed`

> In development, email sending is simulated. Logs appear in the backend console with the `[DUNNING]` prefix.

---

## Environment Variables

### Backend (`packages/backend/.env`)

```env
NODE_ENV=development
PORT=4040
DATABASE_URL=postgresql://cashflow:cashflow@localhost:5433/cashflow
TEST_DATABASE_URL=postgresql://cashflow:cashflow@localhost:5433/cashflow_test
REDIS_URL=redis://localhost:6380
JWT_SECRET=change_me_in_production
JWT_REFRESH_SECRET=change_me_too
```

### Frontend (`packages/frontend/.env`)

```env
VITE_API_URL=http://localhost:4040/graphql
```

---

## Docker Compose

Available services:

| Service    | Host Port | Description                                            |
| ---------- | --------- | ------------------------------------------------------ |
| `postgres` | **5433**  | PostgreSQL 16 database (remapped from 5432)            |
| `redis`    | **6380**  | Redis 7 — cache and BullMQ queues (remapped from 6379) |

> Ports are remapped to avoid conflicts with other local services.

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Reset data (wipe volumes + re-migrate + re-seed)
docker-compose down -v && docker-compose up -d
cd packages/backend && pnpm migrate:up && pnpm seed
```

---

## Development Conventions

- **Strict TypeScript** enabled on all packages
- **Tenant isolation**: all SQL queries filter on `company_id` extracted from JWT — never from request params
- **No prop drilling**: server data via Apollo Cache, global state via React Context
- **Migrations**: never modify an existing migration, always create a new one with `pnpm migrate:create`
- **DataLoader**: required for every relation field in GraphQL to avoid N+1
- **Tests**: one test file per source file

---

## License

emarubi
