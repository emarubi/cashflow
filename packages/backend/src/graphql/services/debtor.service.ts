import { Pool } from 'pg'
import { DebtorRow } from '@graphql/dataloaders'

type DebtorSort = 'OUTSTANDING_DESC' | 'OVERDUE_DESC' | 'NEXT_ACTION_DATE_ASC'

interface DebtorFilter {
  rating?: string
  workflowId?: string
  search?: string
  hasActiveExecution?: boolean
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
    sort?: DebtorSort,
  ): Promise<DebtorConnection> {
    const params: unknown[] = [companyId]
    const conditions: string[] = ['d.company_id = $1']
    let paramIdx = 2

    // Cursor pagination only applies when no custom sort is requested
    if (!sort && after) {
      const { createdAt, id } = decodeCursor(after)
      conditions.push(`(d.created_at, d.id) < ($${paramIdx}::timestamptz, $${paramIdx + 1})`)
      params.push(createdAt, id)
      paramIdx += 2
    }
    if (filter?.rating) {
      conditions.push(`d.rating = $${paramIdx}`)
      params.push(filter.rating)
      paramIdx++
    }
    if (filter?.workflowId) {
      conditions.push(`d.workflow_id = $${paramIdx}`)
      params.push(filter.workflowId)
      paramIdx++
    }
    if (filter?.search) {
      conditions.push(`(d.name ILIKE $${paramIdx} OR d.email ILIKE $${paramIdx})`)
      params.push(`%${filter.search}%`)
      paramIdx++
    }
    if (filter?.hasActiveExecution) {
      conditions.push(
        `EXISTS (SELECT 1 FROM executions ex JOIN invoices inv ON inv.id = ex.invoice_id WHERE inv.debtor_id = d.id AND ex.status = 'active')`,
      )
    }

    const where = conditions.join(' AND ')
    const limit = first + 1

    let orderBy: string
    switch (sort) {
      case 'OUTSTANDING_DESC':
        orderBy = `(SELECT COALESCE(SUM(inv.outstanding), 0) FROM invoices inv WHERE inv.debtor_id = d.id AND inv.status IN ('due', 'overdue')) DESC, d.id DESC`
        break
      case 'OVERDUE_DESC':
        orderBy = `(SELECT COALESCE(SUM(inv.outstanding), 0) FROM invoices inv WHERE inv.debtor_id = d.id AND inv.status = 'overdue') DESC, d.id DESC`
        break
      case 'NEXT_ACTION_DATE_ASC':
        orderBy = `(SELECT MIN(ex.next_run_at) FROM executions ex JOIN invoices inv ON inv.id = ex.invoice_id WHERE inv.debtor_id = d.id AND ex.status = 'active') ASC NULLS LAST, d.id DESC`
        break
      default:
        orderBy = `d.created_at DESC, d.id DESC`
    }

    // Simplified count query — no cursor params needed
    const countConditions: string[] = ['d.company_id = $1']
    const countParams: unknown[] = [companyId]
    let countIdx = 2
    if (filter?.rating) { countConditions.push(`d.rating = $${countIdx}`); countParams.push(filter.rating); countIdx++ }
    if (filter?.workflowId) { countConditions.push(`d.workflow_id = $${countIdx}`); countParams.push(filter.workflowId); countIdx++ }
    if (filter?.search) { countConditions.push(`(d.name ILIKE $${countIdx} OR d.email ILIKE $${countIdx})`); countParams.push(`%${filter.search}%`); countIdx++ }
    if (filter?.hasActiveExecution) {
      countConditions.push(`EXISTS (SELECT 1 FROM executions ex JOIN invoices inv ON inv.id = ex.invoice_id WHERE inv.debtor_id = d.id AND ex.status = 'active')`)
    }

    const [dataResult, countResult] = await Promise.all([
      this.pool.query<DebtorRow>(
        `SELECT d.id, d.company_id, d.name, d.email, d.rating, d.has_payment_method, d.assigned_user_id, d.workflow_id, d.created_at, d.updated_at
         FROM debtors d WHERE ${where}
         ORDER BY ${orderBy}
         LIMIT ${limit}`,
        params,
      ),
      this.pool.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM debtors d WHERE ${countConditions.join(' AND ')}`,
        countParams,
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

  async getOverdueAmount(id: string, companyId: string): Promise<number> {
    const { rows } = await this.pool.query<{ total: string }>(
      `SELECT COALESCE(SUM(outstanding), 0) AS total
       FROM invoices
       WHERE debtor_id = $1 AND company_id = $2 AND status = 'overdue'`,
      [id, companyId],
    )
    return parseFloat(rows[0]?.total ?? '0')
  }

  async getNextActionDate(id: string, companyId: string): Promise<Date | null> {
    const { rows } = await this.pool.query<{ next_at: Date | null }>(
      `SELECT MIN(e.next_run_at) AS next_at
       FROM executions e
       JOIN invoices i ON i.id = e.invoice_id
       WHERE i.debtor_id = $1 AND i.company_id = $2 AND e.status = 'active' AND e.next_run_at IS NOT NULL`,
      [id, companyId],
    )
    return rows[0]?.next_at ?? null
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
