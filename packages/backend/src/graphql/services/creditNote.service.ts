import { Pool } from 'pg'
import { CreditNoteRow } from '@graphql/dataloaders'

interface CreditNoteFilter {
  debtorId?: string
  status?: string
  currency?: string
  search?: string
}

interface CreditNoteConnection {
  edges: Array<{ cursor: string; node: CreditNoteRow }>
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

const SELECT_COLS = `id, company_id, debtor_id, invoice_id, number, title, source,
  currency, amount, amount_applied, status, issue_date, created_at, updated_at`

export class CreditNoteService {
  constructor(private pool: Pool) {}

  async list(
    companyId: string,
    first = 20,
    after?: string,
    filter?: CreditNoteFilter,
  ): Promise<CreditNoteConnection> {
    const params: unknown[] = [companyId]
    const conditions: string[] = ['cn.company_id = $1']
    let paramIdx = 2

    if (after) {
      const { createdAt, id } = decodeCursor(after)
      conditions.push(`(cn.created_at, cn.id) < ($${paramIdx}::timestamptz, $${paramIdx + 1})`)
      params.push(createdAt, id)
      paramIdx += 2
    }
    if (filter?.debtorId) {
      conditions.push(`cn.debtor_id = $${paramIdx}`)
      params.push(filter.debtorId)
      paramIdx++
    }
    if (filter?.status) {
      conditions.push(`cn.status = $${paramIdx}`)
      params.push(filter.status)
      paramIdx++
    }
    if (filter?.currency) {
      conditions.push(`cn.currency = $${paramIdx}`)
      params.push(filter.currency)
      paramIdx++
    }
    if (filter?.search) {
      conditions.push(`(cn.number ILIKE $${paramIdx} OR cn.title ILIKE $${paramIdx} OR d.name ILIKE $${paramIdx})`)
      params.push(`%${filter.search}%`)
      paramIdx++
    }

    const where = conditions.join(' AND ')
    const limit = first + 1

    const countParams: unknown[] = [companyId]
    const countConditions: string[] = ['cn.company_id = $1']
    let countIdx = 2
    if (filter?.debtorId) { countConditions.push(`cn.debtor_id = $${countIdx}`); countParams.push(filter.debtorId); countIdx++ }
    if (filter?.status) { countConditions.push(`cn.status = $${countIdx}`); countParams.push(filter.status); countIdx++ }
    if (filter?.currency) { countConditions.push(`cn.currency = $${countIdx}`); countParams.push(filter.currency); countIdx++ }
    if (filter?.search) { countConditions.push(`(cn.number ILIKE $${countIdx} OR cn.title ILIKE $${countIdx} OR d.name ILIKE $${countIdx})`); countParams.push(`%${filter.search}%`); countIdx++ }

    const [dataResult, countResult] = await Promise.all([
      this.pool.query<CreditNoteRow>(
        `SELECT cn.id, cn.company_id, cn.debtor_id, cn.invoice_id, cn.number, cn.title, cn.source,
                cn.currency, cn.amount, cn.amount_applied, cn.status, cn.issue_date, cn.created_at, cn.updated_at
         FROM credit_notes cn
         LEFT JOIN debtors d ON d.id = cn.debtor_id
         WHERE ${where}
         ORDER BY cn.created_at DESC, cn.id DESC
         LIMIT ${limit}`,
        params,
      ),
      this.pool.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM credit_notes cn LEFT JOIN debtors d ON d.id = cn.debtor_id WHERE ${countConditions.join(' AND ')}`,
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

  async getById(id: string, companyId: string): Promise<CreditNoteRow | null> {
    const { rows } = await this.pool.query<CreditNoteRow>(
      `SELECT ${SELECT_COLS} FROM credit_notes WHERE id = $1 AND company_id = $2`,
      [id, companyId],
    )
    return rows[0] ?? null
  }
}
