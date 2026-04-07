import { pool } from '@db/pool'
import { dunningQueue } from './dunning.queue'

interface ExecutionDue {
  id: string
  current_action_id: string
  invoice_id: string
  company_id: string
}

async function enqueueReadyExecutions(): Promise<void> {
  try {
    const { rows } = await pool.query<ExecutionDue>(
      `SELECT e.id, e.current_action_id, e.invoice_id, i.company_id
       FROM executions e
       JOIN invoices i ON i.id = e.invoice_id
       WHERE e.status = 'active'
         AND e.next_run_at <= NOW()
         AND e.current_action_id IS NOT NULL`,
    )

    if (rows.length === 0) return

    for (const exec of rows) {
      const jitterMs = Math.floor(Math.random() * 5 * 60 * 1000) // 0–5 min
      await dunningQueue.add(
        'dunning-job',
        {
          executionId: exec.id,
          actionId: exec.current_action_id,
          invoiceId: exec.invoice_id,
          companyId: exec.company_id,
        },
        { delay: jitterMs },
      )
    }

    console.log(`[SCHEDULER] Enqueued ${rows.length} dunning jobs`)
  } catch (err) {
    console.error('[SCHEDULER] Error enqueuing jobs:', err)
  }
}

export function startScheduler(): NodeJS.Timeout {
  console.log('[SCHEDULER] Starting dunning scheduler (60s interval)')
  // Run immediately on start, then every 60 seconds
  void enqueueReadyExecutions()
  return setInterval(() => void enqueueReadyExecutions(), 60_000)
}
