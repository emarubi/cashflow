CREATE TABLE payments (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  debtor_id   UUID          REFERENCES debtors(id)   ON DELETE SET NULL,
  invoice_id  UUID          REFERENCES invoices(id)  ON DELETE SET NULL,
  reference   VARCHAR(255)  NOT NULL,
  amount      DECIMAL(15,2) NOT NULL,
  currency    CHAR(3)       NOT NULL DEFAULT 'EUR',
  method      VARCHAR(50),  -- 'card' | 'transfer' | 'direct_debit'
  source      VARCHAR(100), -- 'upflow' | 'stripe' | 'gocardless' | ...
  status      VARCHAR(50)   NOT NULL DEFAULT 'success',
              -- 'success' | 'pending' | 'failed' | 'refunded'
  received_at TIMESTAMP     NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_company ON payments (company_id);
CREATE INDEX idx_payments_invoice ON payments (invoice_id);
