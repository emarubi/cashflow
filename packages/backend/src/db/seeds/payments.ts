import { PoolClient } from 'pg'
import { uuid, faker, batchInsert, randomItem, addDays } from './helpers'
import { CompanyRecord } from './companies'
import { InvoiceRecord } from './invoices'
import { DebtorRecord } from './debtors'

const METHOD_BY_COMPANY: Record<string, string[]> = {
  'open-demo':    ['card', 'transfer'],
  'acme-finance': ['transfer'],
  'nord-supply':  ['direct_debit', 'transfer'],
}

const SOURCE_BY_COMPANY: Record<string, string[]> = {
  'open-demo':    ['stripe', 'upflow'],
  'acme-finance': ['upflow', 'gocardless'],
  'nord-supply':  ['gocardless', 'upflow'],
}

export async function seedPayments(
  client: PoolClient,
  companies: CompanyRecord[],
  invoices: InvoiceRecord[],
  debtors: DebtorRecord[],
): Promise<void> {
  const columns = [
    'id', 'company_id', 'debtor_id', 'invoice_id', 'reference',
    'amount', 'currency', 'method', 'source', 'status', 'received_at',
  ]
  const rows: unknown[][] = []
  const now = new Date()

  // Build debtor lookup
  const debtorByCompany = new Map<string, DebtorRecord[]>()
  for (const d of debtors) {
    const arr = debtorByCompany.get(d.companyId) ?? []
    arr.push(d)
    debtorByCompany.set(d.companyId, arr)
  }

  for (const company of companies) {
    const methods = METHOD_BY_COMPANY[company.slug] ?? ['transfer']
    const sources = SOURCE_BY_COMPANY[company.slug] ?? ['upflow']
    const companyInvoices = invoices.filter((i) => i.companyId === company.id)

    // 1. Full payments for paid invoices
    for (const inv of companyInvoices.filter((i) => i.status === 'paid')) {
      const receivedAt = addDays(inv.dueDate, faker.number.int({ min: -5, max: 15 }))
      rows.push([
        uuid(), company.id, inv.debtorId, inv.id,
        `PAY-${faker.string.alphanumeric(8).toUpperCase()}`,
        inv.amount, inv.currency,
        randomItem(methods), randomItem(sources),
        'success',
        (receivedAt > new Date(2020, 0, 1) ? receivedAt : inv.dueDate).toISOString(),
      ])
    }

    // 2. Partial payments for partially-paid due/overdue invoices (outstanding < amount)
    const partiallyPaid = companyInvoices.filter(
      (i) => (i.status === 'due' || i.status === 'overdue') && i.outstanding < i.amount,
    )
    for (const inv of partiallyPaid) {
      const paidAmount = Math.round((inv.amount - inv.outstanding) * 100) / 100
      const receivedAt = addDays(inv.dueDate, -faker.number.int({ min: 0, max: 30 }))
      rows.push([
        uuid(), company.id, inv.debtorId, inv.id,
        `PAY-${faker.string.alphanumeric(8).toUpperCase()}`,
        paidAmount, inv.currency,
        randomItem(methods), randomItem(sources),
        'success',
        (receivedAt > new Date(2020, 0, 1) ? receivedAt : now).toISOString(),
      ])
    }

    // 3. A few pending payments on recent due invoices (~5%)
    const recentDue = companyInvoices.filter((i) => i.status === 'due').slice(0, 10)
    for (const inv of recentDue) {
      if (Math.random() < 0.30) {
        rows.push([
          uuid(), company.id, inv.debtorId, inv.id,
          `PAY-${faker.string.alphanumeric(8).toUpperCase()}`,
          inv.amount, inv.currency,
          randomItem(methods), randomItem(sources),
          'pending',
          now.toISOString(),
        ])
      }
    }
  }

  await batchInsert(client, 'payments', columns, rows)
  console.log(`  ✓ payments: ${rows.length}`)
}
