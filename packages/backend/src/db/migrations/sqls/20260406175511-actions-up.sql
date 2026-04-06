CREATE TABLE actions (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID         NOT NULL REFERENCES workflows(id)      ON DELETE CASCADE,
  delay_days  INT          NOT NULL,                              -- negative = before due date
  trigger     VARCHAR(50)  NOT NULL DEFAULT 'after_due',         -- 'before_due' | 'after_due' | 'on_issue'
  channel     VARCHAR(50)  NOT NULL,                             -- 'email' | 'call' | 'letter'
  template_id UUID         REFERENCES email_templates(id) ON DELETE SET NULL,
  sender_name VARCHAR(255),
  step_order  INT          NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_actions_workflow ON actions (workflow_id);
