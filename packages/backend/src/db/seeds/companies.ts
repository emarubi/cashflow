import { PoolClient } from 'pg'
import { uuid } from './helpers'

export interface CompanyRecord {
  id: string
  slug: string
  name: string
  currency: string
}

export async function seedCompanies(client: PoolClient): Promise<CompanyRecord[]> {
  const companies: CompanyRecord[] = [
    { id: uuid(), slug: 'open-demo', name: 'Open Demo Inc.', currency: 'USD' },
    { id: uuid(), slug: 'acme-finance', name: 'Acme Finance', currency: 'USD' },
    { id: uuid(), slug: 'nord-supply', name: 'Nord Supply', currency: 'EUR' },
  ]

  for (const c of companies) {
    await client.query(
      `INSERT INTO companies (id, name, slug, plan) VALUES ($1, $2, $3, $4)`,
      [c.id, c.name, c.slug, 'pro'],
    )
  }

  console.log(`  ✓ companies: ${companies.length}`)
  return companies
}
