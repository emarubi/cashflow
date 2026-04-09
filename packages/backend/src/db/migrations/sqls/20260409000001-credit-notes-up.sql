CREATE TABLE credit_notes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  debtor_id      UUID REFERENCES debtors(id) ON DELETE SET NULL,
  invoice_id     UUID REFERENCES invoices(id) ON DELETE SET NULL,
  number         VARCHAR(100) NOT NULL,
  title          VARCHAR(255),
  source         VARCHAR(255),
  currency       CHAR(3) NOT NULL DEFAULT 'EUR',
  amount         DECIMAL(15,2) NOT NULL,
  amount_applied DECIMAL(15,2) NOT NULL DEFAULT 0,
  status         VARCHAR(50) NOT NULL DEFAULT 'unapplied',
                 -- 'unapplied' | 'applied' | 'partial'
  issue_date     DATE NOT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, number)
);

CREATE INDEX idx_credit_notes_company ON credit_notes(company_id);
CREATE INDEX idx_credit_notes_debtor  ON credit_notes(debtor_id);
CREATE INDEX idx_credit_notes_invoice ON credit_notes(invoice_id);
