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

Verify that services are running:
```bash
docker-compose ps
```

### 2. Initialize the database

```bash
cd packages/backend

# Apply migrations
npm run migrate

# Seed with test data
npm run seed
```

### 3. Start the backend

```bash
# From packages/backend
npm run dev
```

The GraphQL API is available at: http://localhost:4000/graphql
The GraphQL playground is available at: http://localhost:4000/graphql (in development)

### 4. Start the frontend

```bash
# From packages/frontend
npm run dev
```

The application is available at: http://localhost:5173

---

## Demo Accounts

Three companies are available after seeding:

### Open Demo Inc.
| Field | Value |
|---|---|
| URL | http://localhost:5173/open-demo |
| Email | john.doe@open-demo.com |
| Password | demo1234 |

### Acme Finance
| Field | Value |
|---|---|
| URL | http://localhost:5173/acme-finance |
| Email | jane.smith@acme-finance.com |
| Password | demo1234 |

### Nord Supply
| Field | Value |
|---|---|
| URL | http://localhost:5173/nord-supply |
| Email | marc.dupont@nord-supply.com |
| Password | demo1234 |

---

## Project Structure

```
cashflow/
├── packages/
│   ├── backend/                  # Node.js + GraphQL API
│   │   ├── src/
│   │   │   ├── auth/             # JWT, middleware
│   │   │   ├── graphql/          # schema, resolvers, dataloaders
│   │   │   ├── db/               # migrations, seeds, pool
│   │   │   ├── queues/           # BullMQ workers and scheduler
│   │   │   ├── cache/            # Redis helpers
│   │   │   └── index.ts
│   │   └── tests/
│   │       ├── unit/
│   │       └── integration/
│   │
│   └── frontend/                 # React App
│       ├── src/
│       │   ├── components/       # reusable components
│       │   ├── pages/            # Dashboard, Workflows, Customers...
│       │   ├── contexts/         # AuthContext, UIContext
│       │   ├── graphql/          # queries and mutations
│       │   ├── hooks/            # custom hooks
│       │   └── locales/          # fr.json, en.json
│       └── tests/
│
├── docker-compose.yml
├── PRD.md                        # Product Requirements Document
├── CLAUDE.md                     # Guide for Claude Code
└── README.md
```

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

## Tests

```bash
# All tests (from root)
npm test

# Backend only
cd packages/backend
npm run test:unit          # unit tests
npm run test:integration   # integration tests

# Frontend only
cd packages/frontend
npm test
```

---

## Queue Architecture

The automated dunning system works as follows:

1. **Scheduler** (every 60s): fetches `executions` where `next_run_at <= NOW()` and enqueues them in BullMQ with a random jitter of 0 to 5 minutes
2. **Worker**: processes each job by checking idempotency, invoice status, then simulates sending (console log + `action_events` insert)
3. **Dead-letter queue**: failed jobs after 5 attempts are logged and the execution is marked `failed`

> In development, email sending is simulated. Logs appear in the backend console with the `[DUNNING]` prefix.

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

## Docker Compose

Available services:

| Service | Port | Description |
|---|---|---|
| `postgres` | 5432 | PostgreSQL database |
| `redis` | 6379 | Cache and BullMQ queues |

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Reset data
docker-compose down -v && docker-compose up -d
npm run migrate && npm run seed
```

---

## Development Conventions

- **Strict TypeScript** enabled on all packages
- **Tenant isolation**: all SQL queries filter on `company_id` extracted from JWT
- **No prop drilling**: server data via Apollo Cache, global state via React Context
- **Migrations**: never modify an existing migration, always create a new one
- **Tests**: one test file per source file

---

## License

MIT
