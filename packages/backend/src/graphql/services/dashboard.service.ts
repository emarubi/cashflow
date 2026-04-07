import { Pool } from 'pg'

export interface DashboardData {
  totalUnpaid: number
  totalDue: number
  totalOverdue: number
  totalUnapplied: number
  dso: number
  riskRate: number
  dsoTrend: Array<{ month: string; value: number }>
  riskRateTrend: Array<{ month: string; value: number }>
  actionsToDoCount: number
  topDebtors: Array<{ debtorId: string; name: string; outstanding: number; invoiceCount: number }>
  agingBalance: Array<{ label: string; amount: number; count: number }>
  customersWithPaymentMethod: number
}

export class DashboardService {
  constructor(private pool: Pool) {}

  async getDashboard(companyId: string): Promise<DashboardData> {
    const [
      totals,
      unapplied,
      dso,
      agingRows,
      topDebtorRows,
      actionsCount,
      paymentMethodCount,
      dsoTrendRows,
      riskTrendRows,
    ] = await Promise.all([
      this.pool.query<{ total_unpaid: string; total_due: string; total_overdue: string }>(
        `SELECT
           SUM(outstanding) FILTER (WHERE status IN ('due','overdue')) AS total_unpaid,
           SUM(outstanding) FILTER (WHERE status = 'due')             AS total_due,
           SUM(outstanding) FILTER (WHERE status = 'overdue')         AS total_overdue
         FROM invoices WHERE company_id = $1`,
        [companyId],
      ),
      this.pool.query<{ total_unapplied: string }>(
        `SELECT SUM(amount - applied_amount) AS total_unapplied
         FROM bank_transactions WHERE company_id = $1 AND status = 'unapplied'`,
        [companyId],
      ),
      this.pool.query<{ dso: string; risk_rate: string }>(
        `SELECT
           CASE WHEN SUM(amount) > 0
             THEN ROUND((SUM(outstanding) / SUM(amount)) * 365, 1)
             ELSE 0
           END AS dso,
           CASE WHEN COUNT(*) > 0
             THEN ROUND(COUNT(*) FILTER (WHERE status = 'overdue') * 100.0 / COUNT(*), 1)
             ELSE 0
           END AS risk_rate
         FROM invoices
         WHERE company_id = $1
           AND issue_date >= NOW() - INTERVAL '12 months'
           AND status != 'draft'`,
        [companyId],
      ),
      this.pool.query<{ label: string; amount: string; count: string }>(
        `SELECT
           CASE
             WHEN NOW() - due_date <= INTERVAL '30 days' THEN '0-30'
             WHEN NOW() - due_date <= INTERVAL '60 days' THEN '31-60'
             WHEN NOW() - due_date <= INTERVAL '90 days' THEN '61-90'
             ELSE '90+'
           END AS label,
           SUM(outstanding) AS amount,
           COUNT(*)         AS count
         FROM invoices
         WHERE company_id = $1 AND status IN ('due','overdue')
         GROUP BY 1
         ORDER BY MIN(due_date)`,
        [companyId],
      ),
      this.pool.query<{ debtor_id: string; name: string; outstanding: string; invoice_count: string }>(
        `SELECT d.id AS debtor_id, d.name, SUM(i.outstanding) AS outstanding, COUNT(i.id) AS invoice_count
         FROM invoices i JOIN debtors d ON d.id = i.debtor_id
         WHERE i.company_id = $1 AND i.status IN ('due','overdue')
         GROUP BY d.id, d.name
         ORDER BY outstanding DESC
         LIMIT 5`,
        [companyId],
      ),
      this.pool.query<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM executions e
         JOIN invoices i ON i.id = e.invoice_id
         WHERE i.company_id = $1 AND e.status = 'active' AND e.next_run_at <= NOW()`,
        [companyId],
      ),
      this.pool.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM debtors WHERE company_id = $1 AND has_payment_method = TRUE`,
        [companyId],
      ),
      this.pool.query<{ month: string; value: string }>(
        `SELECT TO_CHAR(DATE_TRUNC('month', issue_date), 'YYYY-MM') AS month,
                CASE WHEN SUM(amount) > 0
                  THEN ROUND((SUM(outstanding) / SUM(amount)) * 365, 1)
                  ELSE 0
                END AS value
         FROM invoices
         WHERE company_id = $1
           AND issue_date >= NOW() - INTERVAL '6 months'
           AND status != 'draft'
         GROUP BY 1 ORDER BY 1`,
        [companyId],
      ),
      this.pool.query<{ month: string; value: string }>(
        `SELECT TO_CHAR(DATE_TRUNC('month', issue_date), 'YYYY-MM') AS month,
                CASE WHEN COUNT(*) > 0
                  THEN ROUND(COUNT(*) FILTER (WHERE status = 'overdue') * 100.0 / COUNT(*), 1)
                  ELSE 0
                END AS value
         FROM invoices
         WHERE company_id = $1
           AND issue_date >= NOW() - INTERVAL '6 months'
           AND status != 'draft'
         GROUP BY 1 ORDER BY 1`,
        [companyId],
      ),
    ])

    const t = totals.rows[0]
    return {
      totalUnpaid: parseFloat(t.total_unpaid ?? '0'),
      totalDue: parseFloat(t.total_due ?? '0'),
      totalOverdue: parseFloat(t.total_overdue ?? '0'),
      totalUnapplied: parseFloat(unapplied.rows[0]?.total_unapplied ?? '0'),
      dso: parseFloat(dso.rows[0]?.dso ?? '0'),
      riskRate: parseFloat(dso.rows[0]?.risk_rate ?? '0'),
      dsoTrend: dsoTrendRows.rows.map((r) => ({ month: r.month, value: parseFloat(r.value) })),
      riskRateTrend: riskTrendRows.rows.map((r) => ({ month: r.month, value: parseFloat(r.value) })),
      actionsToDoCount: parseInt(actionsCount.rows[0]?.count ?? '0', 10),
      topDebtors: topDebtorRows.rows.map((r) => ({
        debtorId: r.debtor_id,
        name: r.name,
        outstanding: parseFloat(r.outstanding),
        invoiceCount: parseInt(r.invoice_count, 10),
      })),
      agingBalance: agingRows.rows.map((r) => ({
        label: r.label,
        amount: parseFloat(r.amount),
        count: parseInt(r.count, 10),
      })),
      customersWithPaymentMethod: parseInt(paymentMethodCount.rows[0]?.count ?? '0', 10),
    }
  }
}
