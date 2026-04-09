import { Pool } from 'pg'
import { PaymentRow } from '@graphql/dataloaders'

interface PaymentFilter {
  status?: string
  debtorId?: string
  invoiceId?: string
}

interface PaymentConnection {
  edges: Array<{ cursor: string; node: PaymentRow }>
  pageInfo: { hasNextPage: boolean; hasPreviousPage: boolean; startCursor: string | null; endCursor: string | null }
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

export class PaymentService {
  constructor(private pool: Pool) {}

  async list(companyId: string, first = 20, after?: string, filter?: PaymentFilter): Promise<PaymentConnection> {
    const params: unknown[] = [companyId]
    const conditions: string[] = ['company_id = $1']
    let paramIdx = 2

    if (after) {
      const { createdAt, id } = decodeCursor(after)
      conditions.push(`(created_at, id) < ($${paramIdx}::timestamptz, $${paramIdx + 1})`)
      params.push(createdAt, id)
      paramIdx += 2
    }
    if (filter?.status) {
      conditions.push(`status = $${paramIdx}`)
      params.push(filter.status)
      paramIdx++
    }
    if (filter?.debtorId) {
      conditions.push(`debtor_id = $${paramIdx}`)
      params.push(filter.debtorId)
      paramIdx++
    }
    if (filter?.invoiceId) {
      conditions.push(`invoice_id = $${paramIdx}`)
      params.push(filter.invoiceId)
      paramIdx++
    }

    const where = conditions.join(' AND ')
    const limit = first + 1

    // Build count params without the cursor condition (always starts from $1=companyId)
    const countParams: unknown[] = [companyId]
    const countConditions: string[] = ['company_id = $1']
    let countIdx = 2
    if (filter?.status) { countConditions.push(`status = $${countIdx}`); countParams.push(filter.status); countIdx++ }
    if (filter?.debtorId) { countConditions.push(`debtor_id = $${countIdx}`); countParams.push(filter.debtorId); countIdx++ }
    if (filter?.invoiceId) { countConditions.push(`invoice_id = $${countIdx}`); countParams.push(filter.invoiceId); countIdx++ }

    const [dataResult, countResult] = await Promise.all([
      this.pool.query<PaymentRow>(
        `SELECT id, company_id, debtor_id, invoice_id, reference, amount, currency, method, source, status, received_at, created_at
         FROM payments WHERE ${where}
         ORDER BY created_at DESC, id DESC LIMIT ${limit}`,
        params,
      ),
      this.pool.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM payments WHERE ${countConditions.join(' AND ')}`,
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

  async getById(id: string, companyId: string): Promise<PaymentRow | null> {
    const { rows } = await this.pool.query<PaymentRow>(
      `SELECT id, company_id, debtor_id, invoice_id, reference, amount, currency, method, source, status, received_at, created_at
       FROM payments WHERE id = $1 AND company_id = $2`,
      [id, companyId],
    )
    return rows[0] ?? null
  }
}
