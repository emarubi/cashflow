import { Pool } from 'pg'

export interface BankTransactionRow {
  id: string
  company_id: string
  amount: string
  currency: string
  description: string | null
  payer: string | null
  status: string
  applied_amount: string
  payment_id: string | null
  external_sync: boolean
  posted_at: Date
  created_at: Date
  updated_at: Date
}

interface BankTransactionFilter {
  status?: string
}

interface BankTransactionConnection {
  edges: Array<{ cursor: string; node: BankTransactionRow }>
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

export class BankTransactionService {
  constructor(private pool: Pool) {}

  async list(companyId: string, first = 20, after?: string, filter?: BankTransactionFilter): Promise<BankTransactionConnection> {
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

    const where = conditions.join(' AND ')
    const limit = first + 1

    const [dataResult, countResult] = await Promise.all([
      this.pool.query<BankTransactionRow>(
        `SELECT id, company_id, amount, currency, description, payer, status, applied_amount, payment_id, external_sync, posted_at, created_at, updated_at
         FROM bank_transactions WHERE ${where}
         ORDER BY created_at DESC, id DESC LIMIT ${limit}`,
        params,
      ),
      this.pool.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM bank_transactions WHERE company_id = $1${filter?.status ? ' AND status = $2' : ''}`,
        [companyId, ...(filter?.status ? [filter.status] : [])],
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

  async applyTransaction(
    bankTransactionId: string,
    paymentId: string,
    appliedAmount: number,
    companyId: string,
  ): Promise<BankTransactionRow> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')

      // Verify bank transaction belongs to company
      const { rows: btRows } = await client.query<BankTransactionRow>(
        `SELECT id, company_id, amount, currency, description, payer, status, applied_amount, payment_id, external_sync, posted_at, created_at, updated_at
         FROM bank_transactions WHERE id = $1 AND company_id = $2 FOR UPDATE`,
        [bankTransactionId, companyId],
      )
      if (btRows.length === 0) throw new Error('Bank transaction not found')

      // Verify payment belongs to company
      const { rows: pRows } = await client.query<{ id: string }>(
        'SELECT id FROM payments WHERE id = $1 AND company_id = $2',
        [paymentId, companyId],
      )
      if (pRows.length === 0) throw new Error('Payment not found')

      const bt = btRows[0]
      const newApplied = parseFloat(bt.applied_amount) + appliedAmount
      const newStatus = newApplied >= parseFloat(bt.amount) ? 'applied' : bt.status

      const { rows: updated } = await client.query<BankTransactionRow>(
        `UPDATE bank_transactions
         SET applied_amount = $1, payment_id = $2, status = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING id, company_id, amount, currency, description, payer, status, applied_amount, payment_id, external_sync, posted_at, created_at, updated_at`,
        [newApplied, paymentId, newStatus, bankTransactionId],
      )

      await client.query('COMMIT')
      return updated[0]
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }
}
