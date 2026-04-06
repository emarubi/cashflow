import { PoolClient } from 'pg'
import { uuid, batchInsert, addDays } from './helpers'
import { ExecutionRecord } from './executions'

export async function seedActionEvents(
  client: PoolClient,
  executions: ExecutionRecord[],
): Promise<void> {
  const columns = ['id', 'execution_id', 'action_id', 'triggered_at', 'result', 'error', 'metadata']
  const rows: unknown[][] = []
  const now = new Date()

  for (const exec of executions) {
    const sortedActions = exec.allActions.sort((a, b) => a.stepOrder - b.stepOrder)
    // Only generate events for steps *before* the current step (already processed)
    const pastSteps = sortedActions.filter((a) => a.stepOrder < exec.currentStepOrder)

    for (const action of pastSteps) {
      const id = uuid()
      // Triggered some days in the past; earlier steps happened earlier
      const daysAgo = (exec.currentStepOrder - action.stepOrder) * 7 + Math.floor(Math.random() * 3)
      const triggeredAt = addDays(now, -daysAgo)

      // 90% sent, 7% failed, 3% skipped
      const roll = Math.random()
      const result = roll < 0.90 ? 'sent' : roll < 0.97 ? 'failed' : 'skipped'
      const error = result === 'failed' ? 'SMTP connection timeout' : null
      const metadata = result === 'sent'
        ? JSON.stringify({ channel: action.channel, deliveredAt: triggeredAt.toISOString() })
        : null

      rows.push([id, exec.id, action.id, triggeredAt.toISOString(), result, error, metadata])
    }
  }

  if (rows.length > 0) {
    await batchInsert(client, 'action_events', columns, rows)
  }
  console.log(`  ✓ action_events: ${rows.length}`)
}
