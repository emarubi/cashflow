import { PoolClient } from 'pg'
import { uuid, faker, batchInsert, randomItem, addDays, toDateStr } from './helpers'
import { CompanyRecord } from './companies'

const TRANSACTION_COUNTS: Record<string, { applied: number; unapplied: number }> = {
  'open-demo':    { applied: 140, unapplied: 80 },
  'acme-finance': { applied: 70,  unapplied: 40 },
  'nord-supply':  { applied: 50,  unapplied: 35 },
}

// Realistic payer names by company sector
function randomPayer(slug: string): string {
  const techPayers = ['Stripe Inc', 'Notion Labs', 'Linear App', 'Vercel Inc', 'Netlify', 'Supabase', 'PlanetScale', 'Render']
  const financePayers = ['BNP Paribas', 'HSBC Holdings', 'Allianz Capital', 'AXA Investment', 'Fidelity Mgmt', 'Vanguard Group']
  const supplyPayers = ['Rexel Distribution', 'Schneider Supply', 'Legrand France', 'Nexans Group', 'Sonepar Corp', 'Wesco Intl']

  if (slug === 'open-demo') return randomItem(techPayers)
  if (slug === 'acme-finance') return randomItem(financePayers)
  return randomItem(supplyPayers)
}

export async function seedBankTransactions(
  client: PoolClient,
  companies: CompanyRecord[],
): Promise<void> {
  const columns = [
    'id', 'company_id', 'amount', 'currency', 'description',
    'payer', 'status', 'applied_amount', 'external_sync', 'posted_at',
  ]
  const rows: unknown[][] = []
  const now = new Date()
  const sixMonthsAgo = addDays(now, -180)

  for (const company of companies) {
    const counts = TRANSACTION_COUNTS[company.slug] ?? { applied: 50, unapplied: 20 }
    const currency = company.slug === 'nord-supply' ? 'EUR' : 'USD'

    // Applied transactions (matched to payments — simplified: no payment_id FK to avoid join)
    for (let i = 0; i < counts.applied; i++) {
      const amount = Math.round(faker.number.int({ min: 500, max: 80000 }) / 100) * 100
      const postedAt = addDays(sixMonthsAgo, faker.number.int({ min: 0, max: 180 }))
      rows.push([
        uuid(), company.id, amount, currency,
        `Wire transfer - ${faker.string.alphanumeric(10).toUpperCase()}`,
        randomPayer(company.slug),
        'applied', amount, true,
        toDateStr(postedAt),
      ])
    }

    // Unapplied transactions (not yet reconciled)
    for (let i = 0; i < counts.unapplied; i++) {
      // Amounts that don't exactly match invoices → harder to reconcile automatically
      const amount = Math.round(faker.number.float({ min: 800, max: 60000, fractionDigits: 2 }) * 100) / 100
      const postedAt = addDays(addDays(now, -30), faker.number.int({ min: 0, max: 30 }))
      rows.push([
        uuid(), company.id, amount, currency,
        `Bank credit - ${faker.string.alphanumeric(8).toUpperCase()}`,
        randomPayer(company.slug),
        'unapplied', 0, false,
        toDateStr(postedAt),
      ])
    }
  }

  await batchInsert(client, 'bank_transactions', columns, rows)
  console.log(`  ✓ bank_transactions: ${rows.length}`)
}
