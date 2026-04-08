import { Pool } from 'pg'
import { ActionEventRow } from '@graphql/dataloaders'

interface ActionEventFilter {
  executionId?: string
  debtorId?: string
  result?: string
}

interface ActionEventConnection {
  edges: Array<{ cursor: string; node: ActionEventRow }>
  pageInfo: { hasNextPage: boolean; hasPreviousPage: boolean; startCursor: string | null; endCursor: string | null }
  totalCount: number
}

function encodeCursor(triggeredAt: Date, id: string): string {
  return Buffer.from(`${triggeredAt.toISOString()}|${id}`).toString('base64')
}
function decodeCursor(cursor: string): { triggeredAt: string; id: string } {
  const decoded = Buffer.from(cursor, 'base64').toString('utf8')
  const [triggeredAt, id] = decoded.split('|')
  return { triggeredAt, id }
}

export class ActionEventService {
  constructor(private pool: Pool) {}

  async list(companyId: string, first = 20, after?: string, filter?: ActionEventFilter): Promise<ActionEventConnection> {
    const params: unknown[] = [companyId]
    const conditions: string[] = ['i.company_id = $1']
    let paramIdx = 2

    if (after) {
      const { triggeredAt, id } = decodeCursor(after)
      conditions.push(`(ae.triggered_at, ae.id) < ($${paramIdx}::timestamptz, $${paramIdx + 1})`)
      params.push(triggeredAt, id)
      paramIdx += 2
    }
    if (filter?.executionId) {
      conditions.push(`ae.execution_id = $${paramIdx}`)
      params.push(filter.executionId)
      paramIdx++
    }
    if (filter?.debtorId) {
      conditions.push(`i.debtor_id = $${paramIdx}`)
      params.push(filter.debtorId)
      paramIdx++
    }
    if (filter?.result) {
      conditions.push(`ae.result = $${paramIdx}`)
      params.push(filter.result)
      paramIdx++
    }

    const where = conditions.join(' AND ')
    const limit = first + 1

    const [dataResult, countResult] = await Promise.all([
      this.pool.query<ActionEventRow>(
        `SELECT ae.id, ae.execution_id, ae.action_id, ae.triggered_at, ae.result, ae.error, ae.metadata
         FROM action_events ae
         JOIN executions e ON e.id = ae.execution_id
         JOIN invoices i ON i.id = e.invoice_id
         WHERE ${where}
         ORDER BY ae.triggered_at DESC, ae.id DESC LIMIT ${limit}`,
        params,
      ),
      this.pool.query<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM action_events ae
         JOIN executions e ON e.id = ae.execution_id
         JOIN invoices i ON i.id = e.invoice_id
         WHERE i.company_id = $1
         ${filter?.executionId ? ' AND ae.execution_id = $2' : ''}
         ${filter?.debtorId ? ` AND i.debtor_id = $${filter?.executionId ? '3' : '2'}` : ''}
         ${filter?.result ? ` AND ae.result = $${[filter?.executionId, filter?.debtorId].filter(Boolean).length + 2}` : ''}`,
        [
          companyId,
          ...(filter?.executionId ? [filter.executionId] : []),
          ...(filter?.debtorId ? [filter.debtorId] : []),
          ...(filter?.result ? [filter.result] : []),
        ],
      ),
    ])

    const rows = dataResult.rows
    const hasNextPage = rows.length > first
    if (hasNextPage) rows.pop()

    return {
      edges: rows.map((r) => ({ cursor: encodeCursor(r.triggered_at, r.id), node: r })),
      pageInfo: {
        hasNextPage,
        hasPreviousPage: !!after,
        startCursor: rows[0] ? encodeCursor(rows[0].triggered_at, rows[0].id) : null,
        endCursor: rows[rows.length - 1] ? encodeCursor(rows[rows.length - 1].triggered_at, rows[rows.length - 1].id) : null,
      },
      totalCount: parseInt(countResult.rows[0]?.count ?? '0', 10),
    }
  }

  async sendAction(executionId: string, actionId: string, companyId: string): Promise<ActionEventRow> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')

      // Verify execution belongs to company
      const { rows: execRows } = await client.query<{ id: string; invoice_id: string; status: string }>(
        `SELECT e.id, e.invoice_id, e.status
         FROM executions e JOIN invoices i ON i.id = e.invoice_id
         WHERE e.id = $1 AND i.company_id = $2 FOR UPDATE`,
        [executionId, companyId],
      )
      if (execRows.length === 0) throw new Error('Execution not found')
      if (execRows[0].status === 'paused') throw new Error('Execution is paused')

      // Verify invoice is still unpaid
      const { rows: invRows } = await client.query<{ status: string }>(
        'SELECT status FROM invoices WHERE id = $1 FOR UPDATE',
        [execRows[0].invoice_id],
      )
      if (invRows[0].status === 'paid') {
        await client.query(
          `UPDATE executions SET status = 'paused', next_run_at = NULL, updated_at = NOW() WHERE id = $1`,
          [executionId],
        )
        await client.query('COMMIT')
        throw new Error('Invoice already paid — execution paused')
      }

      const { rows } = await client.query<ActionEventRow>(
        `INSERT INTO action_events (execution_id, action_id, result, metadata, triggered_at)
         VALUES ($1, $2, 'sent', $3, NOW())
         RETURNING id, execution_id, action_id, triggered_at, result, error, metadata`,
        [executionId, actionId, JSON.stringify({ manual: true, companyId })],
      )

      await client.query('COMMIT')
      console.log(`[DUNNING] Manual action ${actionId} sent for execution ${executionId}`)
      return rows[0]
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }
}
