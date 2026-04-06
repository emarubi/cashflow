import { PoolClient } from 'pg'
import { uuid, faker, batchInsert, randomItem, randomDate, addDays, toDateStr } from './helpers'
import { CompanyRecord } from './companies'
import { DebtorRecord } from './debtors'

export type InvoiceStatus = 'draft' | 'due' | 'overdue' | 'paid' | 'in_dispute'

export interface InvoiceRecord {
  id: string
  companyId: string
  debtorId: string
  status: InvoiceStatus
  amount: number
  outstanding: number
  currency: string
  dueDate: Date
}

type CompanyConfig = {
  count: number
  currency: string
  minAmount: number
  maxAmount: number
  invoicePrefix: string
  historyMonths: number
  // status distribution
  paidPct: number
  duePct: number
  overduePct: number
  disputePct: number
  // rest is draft
  // partial payment rate among due/overdue
  partialPct: number
}

const CONFIGS: Record<string, CompanyConfig> = {
  'open-demo': {
    count: 850, currency: 'USD', minAmount: 500, maxAmount: 50000,
    invoicePrefix: 'INV', historyMonths: 18,
    paidPct: 0.40, duePct: 0.27, overduePct: 0.22, disputePct: 0.06,
    partialPct: 0.20,
  },
  'acme-finance': {
    count: 400, currency: 'USD', minAmount: 5000, maxAmount: 500000,
    invoicePrefix: 'FCT', historyMonths: 24,
    paidPct: 0.40, duePct: 0.20, overduePct: 0.30, disputePct: 0.07,
    partialPct: 0.20,
  },
  'nord-supply': {
    count: 300, currency: 'EUR', minAmount: 1000, maxAmount: 80000,
    invoicePrefix: 'FAC', historyMonths: 12,
    paidPct: 0.40, duePct: 0.25, overduePct: 0.25, disputePct: 0.06,
    partialPct: 0.20,
  },
}

function assignStatuses(count: number, cfg: CompanyConfig): InvoiceStatus[] {
  const paid     = Math.round(count * cfg.paidPct)
  const due      = Math.round(count * cfg.duePct)
  const overdue  = Math.round(count * cfg.overduePct)
  const dispute  = Math.round(count * cfg.disputePct)
  const draft    = count - paid - due - overdue - dispute
  return [
    ...Array(paid).fill('paid' as InvoiceStatus),
    ...Array(due).fill('due' as InvoiceStatus),
    ...Array(overdue).fill('overdue' as InvoiceStatus),
    ...Array(dispute).fill('in_dispute' as InvoiceStatus),
    ...Array(Math.max(0, draft)).fill('draft' as InvoiceStatus),
  ]
}

export async function seedInvoices(
  client: PoolClient,
  companies: CompanyRecord[],
  debtors: DebtorRecord[],
): Promise<InvoiceRecord[]> {
  const all: InvoiceRecord[] = []
  const now = new Date()

  for (const company of companies) {
    const cfg = CONFIGS[company.slug]
    if (!cfg) continue

    const companyDebtors = debtors.filter((d) => d.companyId === company.id)
    const statuses = assignStatuses(cfg.count, cfg)
    // Shuffle so statuses are distributed across debtors
    for (let i = statuses.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[statuses[i], statuses[j]] = [statuses[j], statuses[i]]
    }

    const historyStart = addDays(now, -cfg.historyMonths * 30)
    const columns = [
      'id', 'company_id', 'debtor_id', 'number', 'amount', 'outstanding',
      'currency', 'issue_date', 'due_date', 'status', 'paid_at',
    ]
    const rows: unknown[][] = []
    let counter = 1

    for (const status of statuses) {
      const id = uuid()
      const debtor = randomItem(companyDebtors)
      const amount = Math.round(faker.number.int({ min: cfg.minAmount, max: cfg.maxAmount }) / 100) * 100
      const issueDate = randomDate(historyStart, addDays(now, -30))
      const dueDate = addDays(issueDate, faker.number.int({ min: 30, max: 60 }))

      let outstanding: number
      let paidAt: string | null = null

      if (status === 'paid') {
        outstanding = 0
        // Paid on or shortly after due date
        const paidDate = addDays(dueDate, faker.number.int({ min: -5, max: 30 }))
        paidAt = (paidDate > issueDate ? paidDate : issueDate).toISOString()
      } else if ((status === 'due' || status === 'overdue') && Math.random() < cfg.partialPct) {
        // Partial payment: 10–90% of amount still outstanding
        const paidFraction = faker.number.float({ min: 0.1, max: 0.9, fractionDigits: 2 })
        outstanding = Math.round(amount * paidFraction * 100) / 100
      } else {
        outstanding = amount
      }

      // For overdue invoices make sure due_date is in the past
      const effectiveDueDate = status === 'overdue'
        ? addDays(now, -faker.number.int({ min: 1, max: 180 }))
        : status === 'due'
          ? addDays(now, faker.number.int({ min: 1, max: 60 }))
          : dueDate

      const prefix = cfg.invoicePrefix
      const year = now.getFullYear()
      const number = `${prefix}-${year}-${String(counter++).padStart(5, '0')}`

      rows.push([
        id, company.id, debtor.id, number, amount, outstanding,
        cfg.currency, toDateStr(issueDate), toDateStr(effectiveDueDate), status, paidAt,
      ])
      all.push({ id, companyId: company.id, debtorId: debtor.id, status, amount, outstanding, currency: cfg.currency, dueDate: effectiveDueDate })
    }

    await batchInsert(client, 'invoices', columns, rows)
  }

  console.log(`  ✓ invoices: ${all.length} (paid: ${all.filter(i => i.status === 'paid').length}, due: ${all.filter(i => i.status === 'due').length}, overdue: ${all.filter(i => i.status === 'overdue').length}, dispute: ${all.filter(i => i.status === 'in_dispute').length}, draft: ${all.filter(i => i.status === 'draft').length})`)
  return all
}
