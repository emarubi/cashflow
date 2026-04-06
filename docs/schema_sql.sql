-- =============================================================
-- Cashflow — Schéma PostgreSQL
-- =============================================================
-- Ce fichier est la référence du modèle de données.
-- Ne pas modifier directement en production — utiliser les migrations.
-- =============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- COMPANIES (tenants)
-- =============================================================
CREATE TABLE companies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  plan        VARCHAR(50) NOT NULL DEFAULT 'starter',
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================
-- USERS
-- =============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  role          VARCHAR(50) NOT NULL DEFAULT 'user', -- 'admin' | 'user'
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, email)
);

CREATE INDEX idx_users_company ON users(company_id);

-- =============================================================
-- DEBTORS (clients débiteurs)
-- =============================================================
CREATE TABLE debtors (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  email            VARCHAR(255),
  rating           CHAR(1) CHECK (rating IN ('A','B','C','D')),
  assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  workflow_id      UUID, -- FK ajoutée après création de workflows
  has_payment_method BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_debtors_company ON debtors(company_id);

-- =============================================================
-- EMAIL TEMPLATES
-- =============================================================
CREATE TABLE email_templates (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  subject    VARCHAR(500) NOT NULL,
  body       TEXT NOT NULL,
  channel    VARCHAR(50) NOT NULL DEFAULT 'email', -- 'email' | 'letter'
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_templates_company ON email_templates(company_id);

-- =============================================================
-- WORKFLOWS
-- =============================================================
CREATE TABLE workflows (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id              UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name                    VARCHAR(255) NOT NULL,
  min_contact_delay_days  INT NOT NULL DEFAULT 5,
  first_action_logic      VARCHAR(50) NOT NULL DEFAULT 'standard', -- 'standard' | 'contextualized'
  reply_to                VARCHAR(255),
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workflows_company ON workflows(company_id);

-- FK debtors -> workflows
ALTER TABLE debtors
  ADD CONSTRAINT fk_debtors_workflow
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE SET NULL;

-- =============================================================
-- ACTIONS (étapes d'un workflow)
-- =============================================================
CREATE TABLE actions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id  UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  delay_days   INT NOT NULL,                           -- négatif = avant échéance
  trigger      VARCHAR(50) NOT NULL DEFAULT 'after_due', -- 'before_due' | 'after_due' | 'on_issue'
  channel      VARCHAR(50) NOT NULL,                   -- 'email' | 'call' | 'letter'
  template_id  UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  sender_name  VARCHAR(255),
  step_order   INT NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_actions_workflow ON actions(workflow_id);

-- =============================================================
-- INVOICES
-- =============================================================
CREATE TABLE invoices (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  debtor_id        UUID NOT NULL REFERENCES debtors(id) ON DELETE CASCADE,
  number           VARCHAR(100) NOT NULL,
  amount           DECIMAL(15,2) NOT NULL,
  outstanding      DECIMAL(15,2) NOT NULL,
  currency         CHAR(3) NOT NULL DEFAULT 'EUR',
  issue_date       DATE NOT NULL,
  due_date         DATE NOT NULL,
  status           VARCHAR(50) NOT NULL DEFAULT 'due',
                   -- 'draft' | 'due' | 'overdue' | 'paid' | 'in_dispute'
  paid_at          TIMESTAMP,
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, number)
);

-- Index critique : uniquement les factures impayées (partial index)
CREATE INDEX idx_invoices_unpaid
  ON invoices (due_date, company_id)
  WHERE status IN ('due', 'overdue');

CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_debtor ON invoices(debtor_id);

-- =============================================================
-- EXECUTIONS (état d'exécution d'un workflow pour une facture)
-- =============================================================
CREATE TABLE executions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id        UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  workflow_id       UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  current_action_id UUID REFERENCES actions(id) ON DELETE SET NULL,
  status            VARCHAR(50) NOT NULL DEFAULT 'active',
                    -- 'active' | 'paused' | 'completed' | 'failed'
  next_run_at       TIMESTAMP,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(invoice_id) -- une seule execution active par facture
);

-- Index critique : scheduler poll sur next_run_at
CREATE INDEX idx_executions_next_run
  ON executions (next_run_at)
  WHERE status = 'active';

-- =============================================================
-- ACTION_EVENTS (journal immuable — audit log)
-- =============================================================
CREATE TABLE action_events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id  UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  action_id     UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  triggered_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  result        VARCHAR(50) NOT NULL, -- 'sent' | 'failed' | 'skipped' | 'cancelled_paid'
  error         TEXT,
  metadata      JSONB                 -- données supplémentaires (destinataire, sujet email...)
);

-- Pas d'UPDATE sur cette table — append only
CREATE INDEX idx_action_events_execution ON action_events(execution_id);
CREATE INDEX idx_action_events_action ON action_events(action_id);

-- =============================================================
-- PAYMENTS
-- =============================================================
CREATE TABLE payments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  debtor_id   UUID REFERENCES debtors(id) ON DELETE SET NULL,
  invoice_id  UUID REFERENCES invoices(id) ON DELETE SET NULL,
  reference   VARCHAR(255) NOT NULL,
  amount      DECIMAL(15,2) NOT NULL,
  currency    CHAR(3) NOT NULL DEFAULT 'EUR',
  method      VARCHAR(50),  -- 'card' | 'transfer' | 'direct_debit'
  source      VARCHAR(100), -- 'upflow' | 'stripe' | 'gocardless' | ...
  status      VARCHAR(50) NOT NULL DEFAULT 'success',
              -- 'success' | 'pending' | 'failed' | 'refunded'
  received_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_company ON payments(company_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);

-- =============================================================
-- BANK_TRANSACTIONS
-- =============================================================
CREATE TABLE bank_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  amount          DECIMAL(15,2) NOT NULL,
  currency        CHAR(3) NOT NULL DEFAULT 'EUR',
  description     TEXT,
  payer           VARCHAR(255),
  status          VARCHAR(50) NOT NULL DEFAULT 'unapplied',
                  -- 'unapplied' | 'applied' | 'excluded'
  applied_amount  DECIMAL(15,2) NOT NULL DEFAULT 0,
  payment_id      UUID REFERENCES payments(id) ON DELETE SET NULL,
  external_sync   BOOLEAN NOT NULL DEFAULT FALSE,
  posted_at       DATE NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bank_transactions_company ON bank_transactions(company_id);
CREATE INDEX idx_bank_transactions_status
  ON bank_transactions(company_id, status)
  WHERE status = 'unapplied';
