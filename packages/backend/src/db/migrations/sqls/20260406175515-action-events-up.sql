-- Append-only audit log — no UPDATE ever issued on this table
CREATE TABLE action_events (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID        NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  action_id    UUID        NOT NULL REFERENCES actions(id)    ON DELETE CASCADE,
  triggered_at TIMESTAMP   NOT NULL DEFAULT NOW(),
  result       VARCHAR(50) NOT NULL, -- 'sent' | 'failed' | 'skipped' | 'cancelled_paid'
  error        TEXT,
  metadata     JSONB        -- additional data (recipient, email subject, ...)
);

CREATE INDEX idx_action_events_execution ON action_events (execution_id);
CREATE INDEX idx_action_events_action    ON action_events (action_id);
