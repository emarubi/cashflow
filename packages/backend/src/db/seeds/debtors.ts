import { PoolClient } from 'pg'
import { uuid, faker, batchInsert, randomItem } from './helpers'
import { CompanyRecord } from './companies'
import { UserRecord } from './users'
import { WorkflowRecord } from './workflows'

export interface DebtorRecord {
  id: string
  companyId: string
}

// Rating distribution per company sector
const RATING_WEIGHTS: Record<string, { A: number; B: number; C: number; D: number }> = {
  'open-demo':    { A: 0.30, B: 0.40, C: 0.20, D: 0.10 }, // SaaS: mostly good payers
  'acme-finance': { A: 0.20, B: 0.30, C: 0.30, D: 0.20 }, // Finance: more risk
  'nord-supply':  { A: 0.25, B: 0.35, C: 0.30, D: 0.10 }, // Distribution: mid range
}

const TARGET_COUNTS: Record<string, number> = {
  'open-demo': 500,
  'acme-finance': 200,
  'nord-supply': 150,
}

function pickRating(slug: string): string {
  const w = RATING_WEIGHTS[slug] ?? { A: 0.25, B: 0.25, C: 0.25, D: 0.25 }
  const r = Math.random()
  if (r < w.A) return 'A'
  if (r < w.A + w.B) return 'B'
  if (r < w.A + w.B + w.C) return 'C'
  return 'D'
}

export async function seedDebtors(
  client: PoolClient,
  companies: CompanyRecord[],
  users: UserRecord[],
  workflows: WorkflowRecord[],
): Promise<DebtorRecord[]> {
  const all: DebtorRecord[] = []

  for (const company of companies) {
    const count = TARGET_COUNTS[company.slug] ?? 100
    const companyUsers = users.filter((u) => u.companyId === company.id)
    const companyWorkflows = workflows.filter((w) => w.companyId === company.id)

    const columns = ['id', 'company_id', 'name', 'email', 'rating', 'assigned_user_id', 'workflow_id', 'has_payment_method']
    const rows: unknown[][] = []

    for (let i = 0; i < count; i++) {
      const id = uuid()
      const name = faker.company.name()
      const email = faker.internet.email({ firstName: faker.person.firstName(), lastName: faker.person.lastName() }).toLowerCase()
      const rating = pickRating(company.slug)

      // 80% of debtors get a workflow so we have enough executions
      const workflowId = Math.random() < 0.80 && companyWorkflows.length > 0
        ? randomItem(companyWorkflows).id
        : null

      // Assign to a random finance user
      const assignedUserId = companyUsers.length > 0 ? randomItem(companyUsers).id : null

      // ~25% have a payment method on file
      const hasPaymentMethod = Math.random() < 0.25

      rows.push([id, company.id, name, email, rating, assignedUserId, workflowId, hasPaymentMethod])
      all.push({ id, companyId: company.id })
    }

    await batchInsert(client, 'debtors', columns, rows)
  }

  console.log(`  ✓ debtors: ${all.length}`)
  return all
}
