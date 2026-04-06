CREATE TABLE email_templates (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  subject    VARCHAR(500) NOT NULL,
  body       TEXT         NOT NULL,
  channel    VARCHAR(50)  NOT NULL DEFAULT 'email', -- 'email' | 'letter'
  created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_templates_company ON email_templates (company_id);
