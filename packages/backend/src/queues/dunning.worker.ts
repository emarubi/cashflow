import { Worker, Job } from 'bullmq'
import { redis, createBullMQConnection } from '@cache/redis'
import { pool } from '@db/pool'
import { invalidateDashboardCache } from '@cache/dashboard'
import { DunningJobPayload } from './dunning.queue'

async function processDunningJob(job: Job<DunningJobPayload>): Promise<void> {
  const { executionId, actionId, invoiceId, companyId } = job.data

  // Step 1: Idempotency check
  const idempotencyKey = `idempotency:${executionId}:${actionId}`
  const alreadyProcessed = await redis.get(idempotencyKey)
  if (alreadyProcessed === '1') {
    console.log(`[DUNNING] Skipping already-processed job for execution=${executionId} action=${actionId}`)
    return
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Step 2: Lock invoice and check status
    const { rows: invRows } = await client.query<{ status: string }>(
      'SELECT status FROM invoices WHERE id = $1 AND company_id = $2 FOR UPDATE',
      [invoiceId, companyId],
    )

    if (invRows.length === 0) {
      await client.query('ROLLBACK')
      console.log(`[DUNNING] Invoice ${invoiceId} not found — aborting job`)
      return
    }

    // Step 3: If paid, pause execution
    if (invRows[0].status === 'paid') {
      await client.query(
        `UPDATE executions SET status = 'paused', next_run_at = NULL, updated_at = NOW() WHERE id = $1`,
        [executionId],
      )
      await client.query('COMMIT')
      console.log(`[DUNNING] Invoice ${invoiceId} already paid — execution ${executionId} paused`)
      return
    }

    // Step 4: Simulate sending
    console.log(`[DUNNING] Sending action ${actionId} for invoice ${invoiceId}`)

    // Step 5: Insert action_event
    await client.query(
      `INSERT INTO action_events (execution_id, action_id, result, metadata, triggered_at)
       VALUES ($1, $2, 'sent', $3, NOW())`,
      [executionId, actionId, JSON.stringify({ jobId: job.id, invoiceId, companyId })],
    )

    // Step 6: Advance execution (find next step or complete)
    const { rows: currentRows } = await client.query<{ step_order: number; workflow_id: string }>(
      'SELECT step_order, workflow_id FROM actions WHERE id = $1',
      [actionId],
    )

    if (currentRows.length > 0) {
      const nextOrder = currentRows[0].step_order + 1
      const { rows: nextRows } = await client.query<{ id: string; delay_days: number }>(
        'SELECT id, delay_days FROM actions WHERE workflow_id = $1 AND step_order = $2',
        [currentRows[0].workflow_id, nextOrder],
      )

      if (nextRows.length === 0) {
        await client.query(
          `UPDATE executions SET status = 'completed', current_action_id = NULL, next_run_at = NULL, updated_at = NOW() WHERE id = $1`,
          [executionId],
        )
      } else {
        const next = nextRows[0]
        const jitterMs = Math.floor(Math.random() * 5 * 60 * 1000) // 0–5 min
        const nextRunAt = new Date(Date.now() + next.delay_days * 24 * 60 * 60 * 1000 + jitterMs)
        await client.query(
          `UPDATE executions SET current_action_id = $1, next_run_at = $2, updated_at = NOW() WHERE id = $3`,
          [next.id, nextRunAt.toISOString(), executionId],
        )
      }
    }

    // Step 7: Commit then set idempotency key
    await client.query('COMMIT')
    await redis.set(idempotencyKey, '1', 'EX', 86400)

    // Step 8: Invalidate dashboard cache
    await invalidateDashboardCache(companyId)
  } catch (err) {
    await client.query('ROLLBACK')

    // Insert failed action_event outside the rolled-back transaction
    try {
      const errorMessage = err instanceof Error ? err.message : String(err)
      await pool.query(
        `INSERT INTO action_events (execution_id, action_id, result, error, metadata, triggered_at)
         VALUES ($1, $2, 'failed', $3, $4, NOW())`,
        [executionId, actionId, errorMessage, JSON.stringify({ jobId: job.id })],
      )
    } catch (insertErr) {
      console.error('[DUNNING] Failed to insert failure event:', insertErr)
    }

    throw err // BullMQ will retry
  } finally {
    client.release()
  }
}

export const dunningWorker = new Worker<DunningJobPayload>(
  'dunning-queue',
  processDunningJob,
  {
    connection: createBullMQConnection(),
    concurrency: 5,
  },
)

dunningWorker.on('failed', (job, err) => {
  console.error(`[DUNNING] Job ${job?.id} failed permanently:`, err.message)
})

dunningWorker.on('completed', (job) => {
  console.log(`[DUNNING] Job ${job.id} completed`)
})
