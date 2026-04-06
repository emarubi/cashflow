CREATE TABLE debtors (
  id                 UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id         UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name               VARCHAR(255) NOT NULL,
  email              VARCHAR(255),
  rating             CHAR(1)      CHECK (rating IN ('A', 'B', 'C', 'D')),
  assigned_user_id   UUID         REFERENCES users(id) ON DELETE SET NULL,
  workflow_id        UUID,        -- FK to workflows added in the workflows migration
  has_payment_method BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_debtors_company ON debtors (company_id);
