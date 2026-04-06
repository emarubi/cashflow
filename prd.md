# PRD — Cashflow

## 1. Overview

**Cashflow** is a multi-tenant web application for managing unpaid invoice dunning. It enables finance teams to drive their collections through automated workflows, track payments and bank transactions, and analyze their performance in real time.

This project is a functional clone of Upflow, built with the following stack:
- **Backend:** Node.js, Express, TypeScript, Apollo Server (GraphQL), PostgreSQL, Redis, BullMQ
- **Frontend:** React, TypeScript, Apollo Client, React Context, Tailwind CSS
- **Local Infra:** Docker Compose

---

## 2. Goals

- Faithfully reproduce the main features visible in the Upflow demo
- Implement a realistic multi-tenant architecture with data isolation per company
- Demonstrate mastery of the full tech stack (fullstack TypeScript, GraphQL, queues, auth)
- Serve as preparation material for a Senior Fullstack Engineer technical interview

---

## 3. Target Users

| Role | Description |
|---|---|
| **Company admin** | Configures workflows, manages users |
| **Finance user** | Handles dunning, views dashboard, tracks payments |

Each company is an isolated tenant. A user belongs to a single company.

---

## 4. Features

### 4.1 Authentication
- Login by company (slug or domain) + email + password
- JWT token with refresh token
- Tenant-isolated sessions
- Logout

### 4.2 Dashboard
- KPIs: total unpaid amount, amount due, overdue amount, unapplied amount
- DSO (Days Sales Outstanding) with monthly trend (bar chart)
- Risk rate with monthly trend (bar chart)
- Number of actions to do
- Top debtors by unpaid amount
- Aging balance (breakdown of unpaid amounts by age)
- Customers with a registered payment method

### 4.3 Workflows
- Workflow list with metrics (assigned customers, completed actions, email open rate, outstanding amount, DSO)
- Create / edit a workflow
- Configuration: minimum delay between contacts, reply address, first action logic
- Action sequence: channel (email / call / letter), delay (before/after due date), template, sender
- Assign a workflow to a customer

### 4.4 Customers (Debtors)
- Paginated list with filters and search
- Columns: name, risk rating (A/B/C/D), assigned user, workflow, unpaid amount, payment method
- Customer detail view: action history, invoices, notes

### 4.5 Invoices
- Paginated list with filters (status: due, overdue, in dispute) and search
- Columns: number, customer, status, issue date, due date, unpaid amount, total amount
- Tabs: Invoices / Credit Notes
- Unsent invoices indicator

### 4.6 Actions (To Do)
- "To Do" view and "All" view
- List of pending dunning actions with filters (reminders, replies, billings)
- Action detail: pre-filled email with template, sender, recipient
- Possible actions: Send / Pause / Ignore
- AI feature: customer context summary (simulated)

### 4.7 Emails
- History of emails sent per customer and per invoice
- Status: sent, opened, error

### 4.8 Payments
- Paginated list of payments with filters
- Columns: reference, date, source, status, type, method, customer, associated invoice, amount

### 4.9 Bank Transactions
- Transaction list with status (applied / unapplied)
- Automatic reconciliation suggestions with invoices
- Action: manually apply a transaction to an invoice

---

## 5. Data Model (PostgreSQL)

### Main Tables

```sql
companies         -- tenants
users             -- users per company
debtors           -- debtor customers
invoices          -- invoices (status: draft/due/overdue/paid/in_dispute)
workflows         -- workflow templates per company
actions           -- workflow steps (channel, delay, template)
executions        -- workflow execution state per invoice
action_events     -- immutable history of completed actions
payments          -- received payments
bank_transactions -- imported bank transactions
email_templates   -- email templates per company
```

### Notable Indexes
```sql
-- Partial index on unpaid invoices (critical performance)
CREATE INDEX idx_invoices_unpaid
ON invoices (due_date, company_id)
WHERE status IN ('due', 'overdue');

-- Index on next_run_at for the scheduler
CREATE INDEX idx_executions_next_run
ON executions (next_run_at)
WHERE status = 'active';
```

---

## 6. Backend Architecture

### GraphQL
- Apollo Server with Express
- Typed schema (SDL first)
- Resolvers with DataLoader to avoid N+1
- Authentication via middleware (JWT context)
- Queries: invoices, debtors, workflows, payments, bankTransactions, dashboard
- Mutations: sendAction, pauseExecution, createWorkflow, updateWorkflow, applyBankTransaction

### Queue (BullMQ + Redis)
- `dunning` queue: processing of scheduled dunning actions
- Worker: checks idempotency → simulates email sending → console log + `action_events` insert
- Scheduler: polls every minute on `executions.next_run_at`
- Dead-letter queue: alerts on repeated failures

### Cache (Redis)
- Cache for frequent GraphQL queries (dashboard KPIs, TTL 5 min)
- JWT sessions (refresh tokens)
- Idempotency keys for BullMQ jobs

### Auth
- JWT access token (15 min) + refresh token (7 days) stored in Redis
- Express middleware that injects `{ companyId, userId }` into GraphQL context
- Tenant isolation: all queries filter on `company_id`

---

## 7. Frontend Architecture

### Page Structure
```
/login                    → LoginPage
/:companySlug/dashboard   → DashboardPage
/:companySlug/workflows   → WorkflowsPage
/:companySlug/workflows/:id → WorkflowDetailPage
/:companySlug/customers   → CustomersPage
/:companySlug/customers/:id → CustomerDetailPage
/:companySlug/invoices    → InvoicesPage
/:companySlug/actions     → ActionsPage
/:companySlug/emails      → EmailsPage
/:companySlug/payments    → PaymentsPage
/:companySlug/bank        → BankTransactionsPage
```

### State Management
- **Apollo Cache**: all server data
- **AuthContext**: `{ company, user, token, login, logout }`
- **UIContext**: `{ language, setLanguage, sidebarOpen, setSidebarOpen }`
- **useState / useReducer**: local component state

### i18n
- Library: `react-i18next`
- Languages: French (default) + English
- Files: `locales/fr.json` and `locales/en.json`

---

## 8. Test Data (Seeds)

3 companies with distinct realistic data:

| Company | Slug | Sector | Volume |
|---|---|---|---|
| Open Demo Inc. | `open-demo` | B2B SaaS | ~500 customers, ~850 invoices |
| Acme Finance | `acme-finance` | Financial services | ~200 customers, ~400 invoices |
| Nord Supply | `nord-supply` | Distribution | ~150 customers, ~300 invoices |

Each company has: users, configured workflows, invoices at various statuses, action history, payments, bank transactions.

---

## 9. Tests

### Backend
- **Jest**: unit tests on GraphQL resolvers, BullMQ workers, utilities
- **Supertest**: integration tests on Express endpoints (auth, GraphQL)
- Target coverage: 70%

### Frontend
- **Jest + React Testing Library**: components, hooks, contexts
- Render and interaction tests (filters, pagination, forms)
- Target coverage: 60%

---

## 10. Out of Scope

- Real email sending (simulated by log)
- GCP / Terraform deployment
- External integrations (CRM, banks, payment providers)
- Real AI features (simulated summary)
- Mobile / full responsive
