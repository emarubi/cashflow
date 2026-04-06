import { PoolClient } from 'pg'
import { uuid, hashPassword, faker } from './helpers'
import { CompanyRecord } from './companies'

export interface UserRecord {
  id: string
  companyId: string
  email: string
  role: string
}

const DEMO_PASSWORD = 'demo1234'

// Fixed demo accounts as defined in README + extra finance users per company
const COMPANY_USERS: Record<string, { email: string; name: string; role: string }[]> = {
  'open-demo': [
    { email: 'john.doe@open-demo.com', name: 'John Doe', role: 'admin' },
    { email: 'alice.martin@open-demo.com', name: 'Alice Martin', role: 'user' },
    { email: 'bob.chen@open-demo.com', name: 'Bob Chen', role: 'user' },
    { email: 'clara.smith@open-demo.com', name: 'Clara Smith', role: 'user' },
  ],
  'acme-finance': [
    { email: 'jane.smith@acme-finance.com', name: 'Jane Smith', role: 'admin' },
    { email: 'paul.rivers@acme-finance.com', name: 'Paul Rivers', role: 'user' },
    { email: 'diana.morgan@acme-finance.com', name: 'Diana Morgan', role: 'user' },
  ],
  'nord-supply': [
    { email: 'marc.dupont@nord-supply.com', name: 'Marc Dupont', role: 'admin' },
    { email: 'sarah.kelly@nord-supply.com', name: 'Sarah Kelly', role: 'user' },
    { email: 'leo.walsh@nord-supply.com', name: 'Leo Walsh', role: 'user' },
  ],
}

export async function seedUsers(
  client: PoolClient,
  companies: CompanyRecord[],
): Promise<UserRecord[]> {
  const hash = await hashPassword(DEMO_PASSWORD)
  const all: UserRecord[] = []

  for (const company of companies) {
    const defs = COMPANY_USERS[company.slug] ?? []
    for (const def of defs) {
      const id = uuid()
      await client.query(
        `INSERT INTO users (id, company_id, email, password_hash, name, role) VALUES ($1,$2,$3,$4,$5,$6)`,
        [id, company.id, def.email, hash, def.name, def.role],
      )
      all.push({ id, companyId: company.id, email: def.email, role: def.role })
    }
  }

  console.log(`  ✓ users: ${all.length}`)
  return all
}
