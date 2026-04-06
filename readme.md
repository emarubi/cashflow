# Cashflow

Web application for managing unpaid invoice dunning — a functional clone of Upflow.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, TypeScript |
| API | Apollo Server (GraphQL) |
| Database | PostgreSQL |
| Cache & Queues | Redis, BullMQ |
| Frontend | React, TypeScript, Apollo Client |
| Styling | Tailwind CSS |
| Global State | React Context |
| i18n | react-i18next (FR + EN) |
| Tests | Jest, Supertest, React Testing Library |
| Local Infra | Docker Compose |

---

## Build Status

### ✅ Done

| Area | What was built |
|---|---|
| **Monorepo** | pnpm workspaces, root `package.json`, `pnpm-workspace.yaml` |
| **Docker** | `docker-compose.yml` — postgres:16-alpine (port **5433**), redis:7-alpine (port **6380**), init script creates `cashflow_test` DB |
| **Backend scaffold** | `packages/backend/` — `tsconfig.json` (strict), `package.json`, `.env.example`, empty `src/index.ts` |
| **Frontend scaffold** | `packages/frontend/` — `tsconfig.json` (strict, react-jsx), `vite.config.ts` (React plugin, `@` alias, `/graphql` proxy), `index.html`, `src/main.tsx` |
| **Migrations** | 12 migrations via `db-migrate` in `src/db/migrations/sqls/` — all tables + all indexes including the two critical partial indexes (`idx_invoices_unpaid`, `idx_executions_next_run`) |
| **Seeds** | 12 seeders in `src/db/seeds/` — 3 companies, 10 users, 7 workflows, 22 actions, 850 debtors, 1 550 invoices, 767 executions, 396 action events, 788 payments, 415 bank transactions |

### 🔲 To Do — Backend

| Area | What needs to be built |
|---|---|
| **DB pool** | `src/db/pool.ts` — `pg.Pool` singleton exported for use by resolvers and services |
| **Auth** | `src/auth/` — `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, JWT sign/verify helpers, Express middleware that injects `{ companyId, userId }` into context |
| **GraphQL schema** | `src/graphql/schema.graphql` — SDL for all types: Company, User, Debtor, Invoice, Workflow, Action, Execution, Payment, BankTransaction, Dashboard |
| **Resolvers** | One file per domain: `invoices.resolver.ts`, `debtors.resolver.ts`, `workflows.resolver.ts`, `payments.resolver.ts`, `bankTransactions.resolver.ts`, `dashboard.resolver.ts` |
| **DataLoaders** | Loaders for every relation to avoid N+1 (debtor → invoices, execution → action, etc.) |
| **Mutations** | `sendAction`, `pauseExecution`, `createWorkflow`, `updateWorkflow`, `applyBankTransaction` |
| **Redis cache** | `src/cache/` — client singleton, `get`/`set`/`del` helpers, invalidation on KPI-affecting mutations |
| **BullMQ queue** | `src/queues/dunning.queue.ts` — queue definition, job payload type |
| **BullMQ worker** | `src/queues/dunning.worker.ts` — idempotency check → invoice status check → simulate send → insert `action_events` → advance execution |
| **Scheduler** | `src/queues/scheduler.ts` — polls `executions` every 60s, enqueues with 0–5 min jitter |
| **Express server** | `src/index.ts` — wire Express + Apollo Server + auth middleware + health endpoint |
| **Tests** | Unit tests for resolvers and worker; integration tests for auth endpoints |

### 🔲 To Do — Frontend

| Area | What needs to be built |
|---|---|
| **Apollo Client** | `src/graphql/client.ts` — ApolloClient setup with auth headers |
| **Router** | React Router v6 setup in `main.tsx` with all routes |
| **AuthContext** | `src/contexts/AuthContext.tsx` — login, logout, token refresh, company/user state |
| **UIContext** | `src/contexts/UIContext.tsx` — language, sidebar state |
| **i18n** | `src/locales/fr.json` + `en.json` — all translation keys, `react-i18next` init |
| **Layout** | `src/components/Layout/` — sidebar navigation, top bar, matching Upflow screenshots |
| **Login page** | `src/pages/Login/` — company slug login form |
| **Dashboard** | `src/pages/Dashboard/` — KPIs, DSO bar chart, risk rate chart, aging balance, top debtors |
| **Workflows** | `src/pages/Workflows/` — list + detail with action sequence editor |
| **Customers** | `src/pages/Customers/` — paginated list + customer detail (invoices, action history) |
| **Invoices** | `src/pages/Invoices/` — paginated list with status filters, invoice detail |
| **Actions** | `src/pages/Actions/` — To Do / All views, action send/pause/ignore |
| **Emails** | `src/pages/Emails/` — email history per customer and invoice |
| **Payments** | `src/pages/Payments/` — paginated list with filters |
| **Bank** | `src/pages/Bank/` — transaction list, reconciliation suggestions |
| **GraphQL queries** | One file per page in `src/graphql/queries/` |
| **GraphQL mutations** | In `src/graphql/mutations/` |
| **Custom hooks** | `useInvoices`, `useDebtors`, `useWorkflows`, `useDashboard`, etc. |
| **Tests** | RTL tests for key components and hooks |

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

The GraphQL API will be available at: http://localhost:4000/graphql

### 4. Start the frontend

```bash
# From packages/frontend
pnpm dev
```

The application will be available at: http://localhost:5173

---

## Demo Accounts

Three companies are available after seeding:

### Open Demo Inc. — B2B SaaS
| Field | Value |
|---|---|
| URL | http://localhost:5173/open-demo |
| Email | john.doe@open-demo.com |
| Password | demo1234 |

### Acme Finance — Financial Services
| Field | Value |
|---|---|
| URL | http://localhost:5173/acme-finance |
| Email | jane.smith@acme-finance.com |
| Password | demo1234 |

### Nord Supply — Distribution
| Field | Value |
|---|---|
| URL | http://localhost:5173/nord-supply |
| Email | marc.dupont@nord-supply.com |
| Password | demo1234 |

**Seed data volumes:**

| Company | Debtors | Invoices | Executions | Payments | Bank Txns |
|---|---|---|---|---|---|
| Open Demo Inc. | 500 | 850 | 417 | 435 | 220 |
| Acme Finance | 200 | 400 | 200 | 206 | 110 |
| Nord Supply | 150 | 300 | 150 | 147 | 85 |

---

## Project Structure

```
cashflow/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── auth/                 # [TODO] JWT helpers, middleware, login/refresh routes
│   │   │   ├── graphql/              # [TODO] schema.graphql, resolvers, dataloaders
│   │   │   ├── db/
│   │   │   │   ├── migrations/       # ✅ 12 migrations (db-migrate, SQL files)
│   │   │   │   └── seeds/            # ✅ 12 seeders (faker, batch inserts)
│   │   │   ├── queues/               # [TODO] BullMQ dunning queue, worker, scheduler
│   │   │   ├── cache/                # [TODO] Redis client, KPI cache helpers
│   │   │   └── index.ts              # [TODO] Express + Apollo server bootstrap
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── database.json             # ✅ db-migrate config
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend/
│       ├── src/
│       │   ├── components/           # [TODO] Layout, Sidebar, shared UI
│       │   ├── pages/                # [TODO] all 10 pages
│       │   ├── contexts/             # [TODO] AuthContext, UIContext
│       │   ├── graphql/              # [TODO] queries/, mutations/, client.ts
│       │   ├── hooks/                # [TODO] useInvoices, useDebtors, etc.
│       │   └── locales/              # ✅ fr.json + en.json (empty, ready to fill)
│       ├── index.html                # ✅
│       ├── vite.config.ts            # ✅ React plugin, @ alias, /graphql proxy
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

| Route | Description |
|---|---|
| `/:slug` | Company login page |
| `/:slug/dashboard` | KPIs, DSO, risk rate, aging balance |
| `/:slug/workflows` | Workflow list and configuration |
| `/:slug/workflows/:id` | Workflow detail with its actions |
| `/:slug/customers` | Debtor customer list |
| `/:slug/customers/:id` | Customer detail |
| `/:slug/invoices` | Invoice list with filters |
| `/:slug/actions` | Actions to process (To Do) |
| `/:slug/emails` | Sent email history |
| `/:slug/payments` | Payment list |
| `/:slug/bank` | Bank transactions and reconciliation |

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
PORT=4000
DATABASE_URL=postgresql://cashflow:cashflow@localhost:5433/cashflow
TEST_DATABASE_URL=postgresql://cashflow:cashflow@localhost:5433/cashflow_test
REDIS_URL=redis://localhost:6380
JWT_SECRET=change_me_in_production
JWT_REFRESH_SECRET=change_me_too
```

### Frontend (`packages/frontend/.env`)

```env
VITE_API_URL=http://localhost:4000/graphql
```

---

## Docker Compose

Available services:

| Service | Host Port | Description |
|---|---|---|
| `postgres` | **5433** | PostgreSQL 16 database (remapped from 5432) |
| `redis` | **6380** | Redis 7 — cache and BullMQ queues (remapped from 6379) |

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

MIT
