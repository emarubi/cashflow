CREATE TABLE invoices (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  debtor_id   UUID          NOT NULL REFERENCES debtors(id)  ON DELETE CASCADE,
  number      VARCHAR(100)  NOT NULL,
  amount      DECIMAL(15,2) NOT NULL,
  outstanding DECIMAL(15,2) NOT NULL,
  currency    CHAR(3)       NOT NULL DEFAULT 'EUR',
  issue_date  DATE          NOT NULL,
  due_date    DATE          NOT NULL,
  status      VARCHAR(50)   NOT NULL DEFAULT 'due',
              -- 'draft' | 'due' | 'overdue' | 'paid' | 'in_dispute'
  paid_at     TIMESTAMP,
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, number)
);

-- Critical partial index: only unpaid invoices — used by scheduler and dunning worker
CREATE INDEX idx_invoices_unpaid
  ON invoices (due_date, company_id)
  WHERE status IN ('due', 'overdue');

CREATE INDEX idx_invoices_company ON invoices (company_id);
CREATE INDEX idx_invoices_debtor  ON invoices (debtor_id);
