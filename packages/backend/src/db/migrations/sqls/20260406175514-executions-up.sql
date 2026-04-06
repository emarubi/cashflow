CREATE TABLE executions (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id        UUID        NOT NULL REFERENCES invoices(id)  ON DELETE CASCADE,
  workflow_id       UUID        NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  current_action_id UUID        REFERENCES actions(id) ON DELETE SET NULL,
  status            VARCHAR(50) NOT NULL DEFAULT 'active',
                    -- 'active' | 'paused' | 'completed' | 'failed'
  next_run_at       TIMESTAMP,
  created_at        TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP   NOT NULL DEFAULT NOW(),
  UNIQUE (invoice_id) -- one active execution per invoice at a time
);

-- Critical partial index: scheduler polls this every 60 seconds
CREATE INDEX idx_executions_next_run
  ON executions (next_run_at)
  WHERE status = 'active';
