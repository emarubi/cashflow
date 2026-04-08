import { Pool } from 'pg'
import { DebtorRow } from '@graphql/dataloaders'

interface DebtorFilter {
  rating?: string
  workflowId?: string
  search?: string
}

interface DebtorConnection {
  edges: Array<{ cursor: string; node: DebtorRow }>
  pageInfo: {
    hasNextPage: boolean
    hasPreviousPage: boolean
    startCursor: string | null
    endCursor: string | null
  }
  totalCount: number
}

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`).toString('base64')
}

function decodeCursor(cursor: string): { createdAt: string; id: string } {
  const decoded = Buffer.from(cursor, 'base64').toString('utf8')
  const [createdAt, id] = decoded.split('|')
  return { createdAt, id }
}

export class DebtorService {
  constructor(private pool: Pool) {}

  async list(
    companyId: string,
    first = 20,
    after?: string,
    filter?: DebtorFilter,
  ): Promise<DebtorConnection> {
    const params: unknown[] = [companyId]
    const conditions: string[] = ['company_id = $1']
    let paramIdx = 2

    if (after) {
      const { createdAt, id } = decodeCursor(after)
      conditions.push(`(created_at, id) < ($${paramIdx}::timestamptz, $${paramIdx + 1})`)
      params.push(createdAt, id)
      paramIdx += 2
    }
    if (filter?.rating) {
      conditions.push(`rating = $${paramIdx}`)
      params.push(filter.rating)
      paramIdx++
    }
    if (filter?.workflowId) {
      conditions.push(`workflow_id = $${paramIdx}`)
      params.push(filter.workflowId)
      paramIdx++
    }
    if (filter?.search) {
      conditions.push(`(name ILIKE $${paramIdx} OR email ILIKE $${paramIdx})`)
      params.push(`%${filter.search}%`)
      paramIdx++
    }

    const where = conditions.join(' AND ')
    const limit = first + 1

    const countParams = params.filter((_, i) => {
      // Exclude cursor params from count query
      return !after || i < 1 || i >= 3
    })

    const [dataResult, countResult] = await Promise.all([
      this.pool.query<DebtorRow>(
        `SELECT id, company_id, name, email, rating, has_payment_method, assigned_user_id, workflow_id, created_at, updated_at
         FROM debtors WHERE ${where}
         ORDER BY created_at DESC, id DESC
         LIMIT ${limit}`,
        params,
      ),
      this.pool.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM debtors WHERE company_id = $1${filter?.rating ? ` AND rating = $2` : ''}${filter?.search ? ` AND (name ILIKE $${filter?.rating ? '3' : '2'} OR email ILIKE $${filter?.rating ? '3' : '2'})` : ''}`,
        [companyId, ...(filter?.rating ? [filter.rating] : []), ...(filter?.search ? [`%${filter.search}%`] : [])],
      ),
    ])

    const rows = dataResult.rows
    const hasNextPage = rows.length > first
    if (hasNextPage) rows.pop()

    return {
      edges: rows.map((r) => ({ cursor: encodeCursor(r.created_at, r.id), node: r })),
      pageInfo: {
        hasNextPage,
        hasPreviousPage: !!after,
        startCursor: rows[0] ? encodeCursor(rows[0].created_at, rows[0].id) : null,
        endCursor: rows[rows.length - 1] ? encodeCursor(rows[rows.length - 1].created_at, rows[rows.length - 1].id) : null,
      },
      totalCount: parseInt(countResult.rows[0]?.count ?? '0', 10),
    }
  }

  async getById(id: string, companyId: string): Promise<DebtorRow | null> {
    const { rows } = await this.pool.query<DebtorRow>(
      `SELECT id, company_id, name, email, rating, has_payment_method, assigned_user_id, workflow_id, created_at, updated_at
       FROM debtors WHERE id = $1 AND company_id = $2`,
      [id, companyId],
    )
    return rows[0] ?? null
  }

  async getOutstandingAmount(id: string, companyId: string): Promise<number> {
    const { rows } = await this.pool.query<{ total: string }>(
      `SELECT COALESCE(SUM(outstanding), 0) AS total
       FROM invoices
       WHERE debtor_id = $1 AND company_id = $2 AND status IN ('due', 'overdue')`,
      [id, companyId],
    )
    return parseFloat(rows[0]?.total ?? '0')
  }

  async getAvgPaymentDelayDays(id: string, companyId: string): Promise<number | null> {
    const { rows } = await this.pool.query<{ avg_days: string | null }>(
      `SELECT AVG(EXTRACT(DAY FROM (paid_at - due_date))) AS avg_days
       FROM invoices
       WHERE debtor_id = $1 AND company_id = $2 AND status = 'paid' AND paid_at IS NOT NULL`,
      [id, companyId],
    )
    const val = rows[0]?.avg_days
    return val !== null && val !== undefined ? Math.round(parseFloat(val)) : null
  }

  async getLastContactedAt(id: string, companyId: string): Promise<Date | null> {
    const { rows } = await this.pool.query<{ last_at: Date | null }>(
      `SELECT MAX(ae.triggered_at) AS last_at
       FROM action_events ae
       JOIN executions e ON e.id = ae.execution_id
       JOIN invoices i ON i.id = e.invoice_id
       WHERE i.debtor_id = $1 AND i.company_id = $2`,
      [id, companyId],
    )
    return rows[0]?.last_at ?? null
  }
}
