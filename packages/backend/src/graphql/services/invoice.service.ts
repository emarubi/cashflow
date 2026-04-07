import { Pool } from 'pg'
import { InvoiceRow } from '@graphql/dataloaders'

interface InvoiceFilter {
  status?: string
  debtorId?: string
  search?: string
}

interface InvoiceConnection {
  edges: Array<{ cursor: string; node: InvoiceRow }>
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

export class InvoiceService {
  constructor(private pool: Pool) {}

  async list(
    companyId: string,
    first = 20,
    after?: string,
    filter?: InvoiceFilter,
  ): Promise<InvoiceConnection> {
    const params: unknown[] = [companyId]
    const conditions: string[] = ['i.company_id = $1']
    let paramIdx = 2

    if (after) {
      const { createdAt, id } = decodeCursor(after)
      conditions.push(`(i.created_at, i.id) < ($${paramIdx}::timestamptz, $${paramIdx + 1})`)
      params.push(createdAt, id)
      paramIdx += 2
    }
    if (filter?.status) {
      conditions.push(`i.status = $${paramIdx}`)
      params.push(filter.status)
      paramIdx++
    }
    if (filter?.debtorId) {
      conditions.push(`i.debtor_id = $${paramIdx}`)
      params.push(filter.debtorId)
      paramIdx++
    }
    if (filter?.search) {
      conditions.push(`(i.number ILIKE $${paramIdx} OR d.name ILIKE $${paramIdx})`)
      params.push(`%${filter.search}%`)
      paramIdx++
    }

    const where = conditions.join(' AND ')
    const limit = first + 1

    const [dataResult, countResult] = await Promise.all([
      this.pool.query<InvoiceRow>(
        `SELECT i.id, i.company_id, i.debtor_id, i.number, i.amount, i.outstanding,
                i.currency, i.issue_date, i.due_date, i.status, i.paid_at, i.created_at, i.updated_at
         FROM invoices i
         JOIN debtors d ON d.id = i.debtor_id
         WHERE ${where}
         ORDER BY i.created_at DESC, i.id DESC
         LIMIT ${limit}`,
        params,
      ),
      this.pool.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM invoices i JOIN debtors d ON d.id = i.debtor_id WHERE ${where}`,
        params.slice(0, after ? paramIdx - 1 : paramIdx - 1),
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

  async getById(id: string, companyId: string): Promise<InvoiceRow | null> {
    const { rows } = await this.pool.query<InvoiceRow>(
      `SELECT id, company_id, debtor_id, number, amount, outstanding, currency, issue_date, due_date, status, paid_at, created_at, updated_at
       FROM invoices WHERE id = $1 AND company_id = $2`,
      [id, companyId],
    )
    return rows[0] ?? null
  }
}
