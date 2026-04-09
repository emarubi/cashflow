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

### ✅ Done — Backend

| Area | What was built |
| ---- | -------------- |
| **Monorepo** | pnpm workspaces, root `package.json`, `pnpm-workspace.yaml` |
| **Docker** | `docker-compose.yml` — postgres:16-alpine (port **5433**), redis:7-alpine (port **6380**), init script creates `cashflow_test` DB |
| **Scaffold** | `packages/backend/` — `tsconfig.json` (strict + `@` path aliases), `package.json`, `.env.example` |
| **Migrations** | 13 migrations via `db-migrate` in `src/db/migrations/sqls/` — all tables + all indexes (including `idx_invoices_unpaid`, `idx_executions_next_run`); `credit_notes` table (migration `20260409000001`); `is_automatic` column on `actions` (migration `20260409000002`) |
| **Seeds** | 12 seeders in `src/db/seeds/` — 3 companies, 10 users, 7 workflows, 22 actions, 850 debtors, 1 550 invoices, 767 executions, 396 action events, 788 payments, 415 bank transactions |
| **DB pool** | `src/db/pool.ts` — `pg.Pool` singleton (max 20 connections) |
| **Auth** | `src/auth/` — JWT sign/verify (15 min access + 7 day refresh), Express middleware, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` |
| **Redis cache** | `src/cache/redis.ts` — ioredis singleton + BullMQ-compatible factory; `src/cache/dashboard.ts` — get/set/invalidate with 5 min TTL |
| **GraphQL schema** | `@/graphql/schema.graphql` — full SDL: 3 scalars, 14 enums (incl. `DebtorSort`), 13+ domain types, 6 cursor-based connection types, 14 queries, 12 mutations |
| **DataLoaders** | `@/graphql/dataloaders.ts` — 14 per-request tenant-scoped loaders: userById, debtorById, invoiceById, workflowById, actionById, emailTemplateById, executionById, executionByInvoiceId, actionsByWorkflowId, actionEventsByExecutionId, paymentById, invoicesByDebtorId, creditNoteById, creditNotesByInvoiceId |
| **Services** | 12 service files in `@/graphql/services/` — all SQL here, all queries scoped to `company_id`; `DebtorService` extended with `getOverdueAmount()`, `getNextActionDate()`, sort-aware `list()`; `ExecutionService` extended with `ignore()` |
| **Resolvers** | 13 resolver files in `@/graphql/resolvers/` + scalars + index — delegates to services, DataLoaders for all relations; `Debtor` type exposes `overdueAmount` + `nextActionDate` |
| **BullMQ queue** | `src/queues/dunning.queue.ts` — `dunning-queue`, 3 attempts with exponential backoff |
| **BullMQ worker** | `src/queues/dunning.worker.ts` — idempotency → invoice lock → pause-if-paid → log → insert event → advance execution → invalidate cache |
| **Scheduler** | `src/queues/dunning.scheduler.ts` — polls `executions` every 60 s, enqueues with 0–5 min jitter |
| **Express server** | `src/index.ts` — Express + Apollo Server v4 (`expressMiddleware`), auth middleware, health endpoint, scheduler + worker startup |
| **Mutations** | `createAction` (creates EmailTemplate + Action in one transaction); `sendTestEmail` (enqueues a test job); `sendAction` (manual dunning trigger); `pauseExecution` / `resumeExecution`; `ignoreAction` (inserts `skipped` event, advances execution); `createWorkflow` / `updateWorkflow`; `applyBankTransaction` |
| **Credit notes** | `CreditNoteService`, `creditNoteResolvers` — full CRUD-style support with debtor + invoice relations |
| **Debtor extensions** | `outstandingAmount`, `overdueAmount`, `nextActionDate`, `avgPaymentDelayDays`, `lastContactedAt` computed fields; `hasActiveExecution` filter and `DebtorSort` enum on `debtors` query |

### 🔲 To Do — Backend

| Area | What needs to be built |
| ---- | ---------------------- |
| **Tests** | Unit tests for resolvers + worker; integration tests for auth endpoints (`tests/unit/`, `tests/integration/`) |
| **Action CC/BCC** | Schema + migration for `cc` / `bcc` columns on `actions` (currently UI-only in the drawer) |

---

### ✅ Done — Frontend

| Area | What was built |
| ---- | -------------- |
| **Infrastructure** | Tailwind CSS + PostCSS; Apollo Client (authLink, errorLink, cursor-based cache policies); react-i18next (FR default, persisted to localStorage); AuthContext; UIContext; `createBrowserRouter` with all routes; Layout + auth guard; icon-only dark Sidebar |
| **Login page** | `src/pages/Login/` — company slug + email + password form, error display |
| **Dashboard** | `src/pages/Dashboard/` — KPI cards, outstanding breakdown, DSO + risk rate sparklines (Recharts), top debtors list, aging balance chart |
| **Workflows list** | `src/pages/Workflows/` — paginated table with type badge, metrics (customers, actions, open rate, outstanding, DSO) |
| **Workflow detail** | `src/pages/Workflows/WorkflowDetail/` — editable title, settings card (min delay, reply-to, first action logic), analytics date filter, action sequence with per-action stats, New Action drawer (fields: trigger, delay, channel, sender, subject, body, auto-send checkbox, test email) |
| **Customers list** | `src/pages/Customers/` — paginated table with search + debounce, "Add customers" dropdown, rating badge, assigned user, workflow, outstanding, total footer |
| **Customer detail** | `src/pages/Customers/CustomerDetail/` — two-column layout: info card (outstanding, avg delay, last contacted, assigned users, workflow + pause/resume), group entities card, payment method card; right panel: Invoices / Payments / Credit Notes / Contacts / Timeline / Details tabs |
| **Invoices list** | `src/pages/Invoices/` — two-tab page (Invoices + Credit Notes); filter panel (Status, Currency) with active chip dismissal; links to detail pages |
| **Invoice detail** | `src/pages/Invoices/InvoiceDetail/` — two-column layout: amounts, dates, customer link, workflow, promise-to-pay, custom fields; right panel: Payments & Credit Notes table + Invoice Timeline (action events with channel icon + result badge) |
| **Credit note detail** | `src/pages/Invoices/CreditNoteDetail/` — two-column layout: info card (customer, amounts, PDF link) + custom fields; right panel: Applied Invoices + Refunds tables |
| **Actions page** | `src/pages/Actions/` — **To Do** view: left panel (search + sort dropdown: overdue desc / outstanding desc / next action date asc; paginated customer list with color dot indicators) + right panel (debtor header, email compose preview with From/Subject/Body, Send / Pause / Ignore action buttons, invoice selector when multiple active); **All** view: paginated table of action events grouped by trigger type (Invoice Issued / Before due / Invoice Due) with result badges and customer + invoice links |
| **GraphQL queries** | `dashboard`, `workflows`, `workflow`, `workflowActionStats`, `customers`, `customer`, `customerInvoices`, `customerPayments`, `customerTimeline`, `invoices`, `invoice`, `invoicePayments`, `creditNotes`, `creditNote`, `actionsToDoByDebtor`, `debtorActiveExecutions`, `allActionEvents`, `emailTemplates` |
| **GraphQL mutations** | `action.ts` — `CREATE_ACTION`, `UPDATE_ACTION`, `DELETE_ACTION`, `SEND_TEST_EMAIL`; `execution.ts` — `SEND_ACTION`, `PAUSE_EXECUTION`, `RESUME_EXECUTION`, `IGNORE_ACTION`; `workflow.ts` — `UPDATE_WORKFLOW` |
| **Hooks** | `useDashboard`, `useWorkflows`, `useWorkflow`, `useWorkflowActionStats`, `useUpdateWorkflow`, `useDebtors`, `useDebtor`, `useDebtorInvoices`, `useDebtorPayments`, `useDebtorTimeline`, `useInvoices`, `useInvoice`, `useInvoicePayments`, `useCreditNotes`, `useCreditNote`, `useEmailTemplates`, `useCreateAction`, `useUpdateAction`, `useDeleteAction`, `useSendTestEmail`, `useActionsToDoByDebtor`, `useDebtorActiveExecutions`, `useAllActionEvents`, `useSendAction`, `usePauseExecution`, `useIgnoreAction` |
| **i18n** | `fr.json` + `en.json` — ~250 keys covering all implemented pages (nav, auth, dashboard, workflows, customers, invoices, actions) |
| **Routes** | 12 routes: login, dashboard, workflows list + detail, customers list + detail, invoices list + invoice detail + credit note detail, actions, payments (stub), bank (stub) |

### 🔲 To Do — Frontend

| Area | What needs to be built |
| ---- | ---------------------- |
| **Payments page** | `src/pages/Payments/` — paginated list with filters (status, customer) |
| **Bank page** | `src/pages/Bank/` — transaction list, reconciliation suggestions, manual apply (`applyBankTransaction` mutation already wired on backend) |
| **Action CC/BCC** | CC and BCC fields in the New Action drawer are UI-only — need backend migration + service columns |
| **Variable picker** | The `{{ }}` button in Subject/Message is a stub — proper variable picker popover (org name, invoice number, due date, etc.) |
| **createWorkflow mutation** | Frontend mutation + hook to create a new workflow from the Workflows list page |
| **Tests** | RTL tests for key components and hooks; unit tests for `ActionService` |

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
│   │   │   │   └── services/         # 12 service files (all SQL here, incl. ActionService)
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
│       │   │   ├── Workflows/        # ✅ list table + WorkflowDetail/ (settings, analytics, action sequence + New Action drawer)
│       │   │   ├── Customers/        # ✅ paginated list with search + CustomerDetail/ (6-tab detail view)
│       │   │   ├── Invoices/         # ✅ list (Invoices + Credit Notes tabs, filter panel)
│       │   │   │   ├── InvoiceDetail/    # ✅ two-column detail (info, payments, timeline)
│       │   │   │   └── CreditNoteDetail/ # ✅ two-column detail (info, applied invoices, refunds)
│       │   │   ├── Actions/          # ✅ To Do / All views, action detail panel (email preview, send/pause/ignore)
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
│       │   │                         #    creditNotes, creditNote,
│       │   │                         #    actionsToDoByDebtor, debtorActiveExecutions, allActionEvents
│       │   ├── hooks/                # ✅ useDashboard, useWorkflows, useWorkflow,
│       │   │                         #    useWorkflowActionStats, useUpdateWorkflow,
│       │   │                         #    useDebtors, useDebtor, useDebtorInvoices,
│       │   │                         #    useDebtorPayments, useDebtorTimeline,
│       │   │                         #    useInvoices, useInvoice, useInvoicePayments,
│       │   │                         #    useCreditNotes, useCreditNote,
│       │   │                         #    useActionsToDoByDebtor, useDebtorActiveExecutions, useAllActionEvents,
│       │   │                         #    useSendAction, usePauseExecution, useIgnoreAction
│       │   ├── locales/              # ✅ fr.json + en.json (nav + auth + dashboard + workflows + customers + invoices + actions)
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

| Route | Status | Description |
| ----- | ------ | ----------- |
| `/:slug` | ✅ | Company login page |
| `/:slug/dashboard` | ✅ | KPIs, DSO, risk rate, top debtors, aging balance chart |
| `/:slug/workflows` | ✅ | Workflow list with metrics |
| `/:slug/workflows/:id` | ✅ | Workflow detail — settings, analytics, action sequence, New Action drawer |
| `/:slug/customers` | ✅ | Debtor list with search, filter, outstanding totals |
| `/:slug/customers/:id` | ✅ | Customer detail — 6-tab right panel, info card, workflow controls |
| `/:slug/invoices` | ✅ | Invoice list + Credit Notes list, filter panel |
| `/:slug/invoices/:id` | ✅ | Invoice detail — amounts, payments, timeline |
| `/:slug/invoices/credit-notes/:id` | ✅ | Credit note detail — applied invoices, refunds |
| `/:slug/actions` | ✅ | To Do view (customer list + action detail panel) and All view (action events table) |
| `/:slug/payments` | 🔲 | Payment list — stub |
| `/:slug/bank` | 🔲 | Bank transactions + reconciliation — stub |

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
