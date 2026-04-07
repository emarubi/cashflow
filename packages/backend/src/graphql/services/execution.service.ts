import { Pool } from 'pg'
import { ExecutionRow, ActionRow } from '@graphql/dataloaders'

export class ExecutionService {
  constructor(private pool: Pool) {}

  async getById(id: string, companyId: string): Promise<ExecutionRow | null> {
    const { rows } = await this.pool.query<ExecutionRow>(
      `SELECT e.id, e.invoice_id, e.workflow_id, e.current_action_id, e.status, e.next_run_at, e.created_at, e.updated_at
       FROM executions e JOIN invoices i ON i.id = e.invoice_id
       WHERE e.id = $1 AND i.company_id = $2`,
      [id, companyId],
    )
    return rows[0] ?? null
  }

  async pause(executionId: string, companyId: string): Promise<ExecutionRow> {
    const { rows } = await this.pool.query<ExecutionRow>(
      `UPDATE executions e SET status = 'paused', next_run_at = NULL, updated_at = NOW()
       FROM invoices i WHERE i.id = e.invoice_id AND e.id = $1 AND i.company_id = $2
       RETURNING e.id, e.invoice_id, e.workflow_id, e.current_action_id, e.status, e.next_run_at, e.created_at, e.updated_at`,
      [executionId, companyId],
    )
    if (rows.length === 0) throw new Error('Execution not found')
    return rows[0]
  }

  async resume(executionId: string, companyId: string): Promise<ExecutionRow> {
    const { rows } = await this.pool.query<ExecutionRow>(
      `UPDATE executions e SET status = 'active', next_run_at = NOW(), updated_at = NOW()
       FROM invoices i WHERE i.id = e.invoice_id AND e.id = $1 AND i.company_id = $2
       RETURNING e.id, e.invoice_id, e.workflow_id, e.current_action_id, e.status, e.next_run_at, e.created_at, e.updated_at`,
      [executionId, companyId],
    )
    if (rows.length === 0) throw new Error('Execution not found')
    return rows[0]
  }

  async advanceExecution(executionId: string, currentActionId: string): Promise<void> {
    // Find the next action in the workflow for this execution
    const { rows: execRows } = await this.pool.query<{ workflow_id: string }>(
      'SELECT workflow_id FROM executions WHERE id = $1',
      [executionId],
    )
    if (execRows.length === 0) return

    const { workflow_id } = execRows[0]

    // Get current action's step_order
    const { rows: currentRows } = await this.pool.query<{ step_order: number }>(
      'SELECT step_order FROM actions WHERE id = $1',
      [currentActionId],
    )
    if (currentRows.length === 0) return

    const nextOrder = currentRows[0].step_order + 1

    // Find next action
    const { rows: nextRows } = await this.pool.query<ActionRow>(
      'SELECT id, workflow_id, delay_days, trigger, channel, template_id, sender_name, step_order, created_at, updated_at FROM actions WHERE workflow_id = $1 AND step_order = $2',
      [workflow_id, nextOrder],
    )

    if (nextRows.length === 0) {
      // No more steps — mark completed
      await this.pool.query(
        `UPDATE executions SET status = 'completed', next_run_at = NULL, current_action_id = NULL, updated_at = NOW() WHERE id = $1`,
        [executionId],
      )
    } else {
      const next = nextRows[0]
      const nextRunAt = new Date(Date.now() + next.delay_days * 24 * 60 * 60 * 1000)
      await this.pool.query(
        `UPDATE executions SET current_action_id = $1, next_run_at = $2, updated_at = NOW() WHERE id = $3`,
        [next.id, nextRunAt.toISOString(), executionId],
      )
    }
  }
}
