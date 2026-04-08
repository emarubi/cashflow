# CLAUDE.md — Cashflow

This file guides Claude Code in understanding the project, its conventions, and architecture decisions.

---

## Reference Resources

Before generating any code, always consult these files:

| Resource       | Path                | Content                                      |
| -------------- | ------------------- | -------------------------------------------- |
| PRD            | `PRD.md`            | Features, data model, architecture           |
| UI Screenshots | `docs/screenshots/` | 10 captures of the target interface (Upflow) |
| SQL Schema     | `docs/schema.sql`   | Complete PostgreSQL schema with indexes      |

Screenshots are the absolute visual reference for the frontend.
Every React component must faithfully match what is visible in those captures.

---

## Project Overview

Cashflow is a multi-tenant fullstack web application for managing unpaid invoice dunning.

- **Monorepo** with two packages: `backend` and `frontend`
- **Backend:** Node.js + Express + TypeScript + Apollo Server + PostgreSQL + Redis + BullMQ
- **Frontend:** React + TypeScript + Apollo Client + React Context + Tailwind CSS
- **Local Infra:** Docker Compose

---

## Monorepo Structure

```
cashflow/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── auth/           # JWT, middleware, refresh tokens
│   │   │   ├── graphql/        # schema SDL, resolvers, dataloaders
│   │   │   ├── db/             # migrations, seeds, Postgres pool
│   │   │   ├── queues/         # BullMQ queues and workers
│   │   │   ├── cache/          # Redis client and helpers
│   │   │   └── index.ts        # Express entry point
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend/
│       ├── src/
│       │   ├── components/     # reusable components
│       │   ├── pages/          # one page = one folder
│       │   ├── contexts/       # AuthContext, UIContext
│       │   ├── graphql/        # queries, mutations, fragments
│       │   ├── hooks/          # custom hooks
│       │   ├── locales/        # fr.json, en.json
│       │   └── main.tsx
│       ├── tests/
│       ├── package.json
│       └── tsconfig.json
│
├── docker-compose.yml
├── PRD.md
├── README.md
└── CLAUDE.md
```

---

## Code Conventions

### General

- **Strict TypeScript**: `"strict": true` in all tsconfigs
- **Naming**: camelCase for variables/functions, PascalCase for types/components, SCREAMING_SNAKE_CASE for constants
- **Imports**: absolute from `src/` (no `../../..`)
- **No `any`**: use `unknown` if the type is unknown
- **Comments**: in English, only to explain the "why", never the "what"

### Backend

- One file per resolver (e.g. `invoices.resolver.ts`)
- Resolvers contain no SQL logic — delegate to services
- Services contain no HTTP/GraphQL logic
- Always filter by `company_id` in SQL queries — mandatory tenant isolation
- Use Postgres transactions for any multi-table operation
- Name migrations: `YYYYMMDD_description.sql`

### Frontend

- One folder per page: `pages/Dashboard/index.tsx` + `pages/Dashboard/Dashboard.test.tsx`
- Components do not fetch data directly — use custom hooks
- Custom hooks are in `hooks/` and prefixed with `use` (e.g. `useInvoices.ts`)
- GraphQL queries are in `graphql/queries/` and mutations in `graphql/mutations/`
- No prop drilling beyond 2 levels — use Apollo Cache or Context

---

## Multi-tenancy — Absolute Rule

**Every SQL query must include `WHERE company_id = $companyId`.**

The `companyId` is injected into the GraphQL context from the JWT:

```typescript
// Apollo Server context
const context = ({ req }) => {
  const token = req.headers.authorization?.split(" ")[1];
  const payload = verifyToken(token);
  return { companyId: payload.companyId, userId: payload.userId };
};

// In every resolver — ALWAYS
const invoices = await db.query(
  "SELECT * FROM invoices WHERE company_id = $1",
  [context.companyId],
);
```

Never trust query parameters for tenant isolation — always use the JWT context.

---

## Database Schema

Key tables and relationships:

```
companies         (id, name, slug, plan, created_at)
users             (id, company_id, email, password_hash, role, name)
debtors           (id, company_id, name, email, rating, assigned_user_id)
invoices          (id, company_id, debtor_id, number, amount, due_date, status, paid_at)
workflows         (id, company_id, name, min_contact_delay_days, is_active)
actions           (id, workflow_id, delay_days, trigger, channel, template_id, step_order)
executions        (id, invoice_id, workflow_id, current_action_id, status, next_run_at)
action_events     (id, execution_id, action_id, triggered_at, result, error)
payments          (id, company_id, debtor_id, invoice_id, amount, method, status, received_at)
bank_transactions (id, company_id, amount, description, payer, status, posted_at)
email_templates   (id, company_id, name, subject, body, channel)
```

Critical indexes to always respect:

- `invoices`: partial index on `status IN ('due','overdue')`
- `executions`: partial index on `next_run_at WHERE status = 'active'`

---

## BullMQ Queue

### `dunning` Queue

- Named `dunning-queue`
- Each job represents an action to execute for a given execution
- Payload: `{ executionId, actionId, invoiceId, companyId }`

### Worker

The worker follows this exact flow:

1. Check idempotency in `action_events` (execution_id + action_id + result = 'sent')
2. If already processed → skip + ack
3. Verify the invoice is still unpaid (FOR UPDATE)
4. If paid → update execution.status = 'paused', next_run_at = null → ack
5. Log to console: `[DUNNING] Sending action ${actionId} for invoice ${invoiceId}`
6. Insert into `action_events` with result = 'sent'
7. Advance execution to the next step or status = 'completed'

### Scheduler

- Runs every 60 seconds
- Query: `SELECT * FROM executions WHERE status = 'active' AND next_run_at <= NOW()`
- Enqueues each result into `dunning-queue` with jitter (0–5 min)

---

## Redis Cache

| Key                                      | Value           | TTL    |
| ---------------------------------------- | --------------- | ------ |
| `dashboard:${companyId}`                 | serialized KPIs | 5 min  |
| `refresh:${userId}`                      | refresh token   | 7 days |
| `idempotency:${executionId}:${actionId}` | `1`             | 24h    |

Invalidate `dashboard:${companyId}` on every mutation that affects KPIs.

---

## JWT Auth

- Access token: 15 min, signed with `JWT_SECRET`
- Refresh token: 7 days, stored in Redis (`refresh:${userId}`)
- Payload: `{ userId, companyId, companySlug, role, iat, exp }`
- Express middleware verifies the token on all routes except `POST /auth/login` and `POST /auth/refresh`

---

## GraphQL — Conventions

- **SDL first**: the schema is defined in `@/graphql/schema.graphql`
- **DataLoader required** for any field that loads a relation (avoid N+1)
- **Pagination**: cursor-based for lists (not offset) — `{ edges, pageInfo }`
- **Errors**: use `GraphQLError` with an explicit code (`UNAUTHORIZED`, `NOT_FOUND`, etc.)

---

## i18n

- Library: `react-i18next`
- Default language: French
- Translation keys: snake_case (`invoice.status.overdue`)
- Files: `src/locales/fr.json` and `src/locales/en.json`
- Never hardcode text in components — always go through `t('key')`

---

## Tests

### Backend

```bash
cd packages/backend
npm test              # all tests
npm run test:unit     # Jest unit tests
npm run test:integration  # Supertest
```

### Frontend

```bash
cd packages/frontend
npm test              # Jest + RTL
```

### Conventions

- One test file per source file: `invoices.resolver.test.ts`
- Mocks: use `jest.mock()` for Postgres and Redis in unit tests
- Integration tests use a separate test DB (variable `TEST_DATABASE_URL`)

---

## Environment Variables

### Backend (`packages/backend/.env`)

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://cashflow:cashflow@localhost:5432/cashflow
TEST_DATABASE_URL=postgresql://cashflow:cashflow@localhost:5432/cashflow_test
REDIS_URL=redis://localhost:6379
JWT_SECRET=change_me_in_production
JWT_REFRESH_SECRET=change_me_too
```

### Frontend (`packages/frontend/.env`)

```env
VITE_API_URL=http://localhost:4000/graphql
```

---

## Useful Commands

```bash
# Start local infrastructure
docker-compose up -d

# Backend
cd packages/backend
npm run dev          # ts-node-dev with hot reload
npm run migrate      # apply migrations
npm run seed         # seed test data

# Frontend
cd packages/frontend
npm run dev          # Vite dev server

# All tests
pnpm test             # from the root (workspace)
```

---

## What Claude Code Must NOT Do

- Never delete existing migrations — always create new ones
- Never expose `company_id` as a GraphQL query parameter — always from the JWT
- Never bypass the auth middleware to "simplify"
- Never put business logic in React components — use hooks
- Never use `SELECT *` in production — always list columns explicitly
- Never commit secrets in code — use environment variables
