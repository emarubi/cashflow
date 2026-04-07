import { pool } from '@db/pool'
import { invalidateDashboardCache } from '@cache/dashboard'
import { dunningWorker } from './dunning.worker'
import { DunningJobPayload } from './dunning.queue'

export function startDLQ(): void {
  dunningWorker.on('failed', async (job, err) => {
    if (!job) return

    const attemptsAllowed = job.opts.attempts ?? 1
    // Only act on permanent failure — not intermediate retries
    if (job.attemptsMade < attemptsAllowed) return

    const { executionId, companyId } = job.data as DunningJobPayload

    console.error(
      `[DLQ] Job ${job.id} permanently failed for execution=${executionId}: ${err.message}`,
    )

    try {
      await pool.query(
        `UPDATE executions
         SET status = 'failed', next_run_at = NULL, updated_at = NOW()
         WHERE id = $1`,
        [executionId],
      )
    } catch (dbErr) {
      console.error(`[DLQ] Failed to mark execution ${executionId} as failed:`, dbErr)
    }

    try {
      await invalidateDashboardCache(companyId)
    } catch (cacheErr) {
      console.error(`[DLQ] Failed to invalidate dashboard cache for company ${companyId}:`, cacheErr)
    }
  })
}
