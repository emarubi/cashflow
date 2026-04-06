CREATE TABLE bank_transactions (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id     UUID          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  amount         DECIMAL(15,2) NOT NULL,
  currency       CHAR(3)       NOT NULL DEFAULT 'EUR',
  description    TEXT,
  payer          VARCHAR(255),
  status         VARCHAR(50)   NOT NULL DEFAULT 'unapplied',
                 -- 'unapplied' | 'applied' | 'excluded'
  applied_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  payment_id     UUID          REFERENCES payments(id) ON DELETE SET NULL,
  external_sync  BOOLEAN       NOT NULL DEFAULT FALSE,
  posted_at      DATE          NOT NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bank_transactions_company ON bank_transactions (company_id);

-- Partial index: reconciliation queries only touch unapplied transactions
CREATE INDEX idx_bank_transactions_status
  ON bank_transactions (company_id, status)
  WHERE status = 'unapplied';
