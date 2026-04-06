CREATE TABLE workflows (
  id                     UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id             UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name                   VARCHAR(255) NOT NULL,
  min_contact_delay_days INT          NOT NULL DEFAULT 5,
  first_action_logic     VARCHAR(50)  NOT NULL DEFAULT 'standard', -- 'standard' | 'contextualized'
  reply_to               VARCHAR(255),
  is_active              BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workflows_company ON workflows (company_id);

-- Close the circular FK: debtors.workflow_id -> workflows
ALTER TABLE debtors
  ADD CONSTRAINT fk_debtors_workflow
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE SET NULL;
