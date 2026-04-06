import 'dotenv/config'
import { pool } from './helpers'
import { seedCompanies } from './companies'
import { seedUsers } from './users'
import { seedEmailTemplates } from './email-templates'
import { seedWorkflows } from './workflows'
import { seedDebtors } from './debtors'
import { seedInvoices } from './invoices'
import { seedExecutions } from './executions'
import { seedActionEvents } from './action-events'
import { seedPayments } from './payments'
import { seedBankTransactions } from './bank-transactions'

async function main(): Promise<void> {
  const client = await pool.connect()
  try {
    console.log('🌱 Starting seed...\n')
    await client.query('BEGIN')

    // Truncate in reverse FK order — idempotent re-run
    await client.query(`
      TRUNCATE
        bank_transactions,
        payments,
        action_events,
        executions,
        invoices,
        actions,
        workflows,
        debtors,
        email_templates,
        users,
        companies
      RESTART IDENTITY CASCADE
    `)

    const companies  = await seedCompanies(client)
    const users      = await seedUsers(client, companies)
    const templates  = await seedEmailTemplates(client, companies)
    const workflows  = await seedWorkflows(client, companies, templates)
    const debtors    = await seedDebtors(client, companies, users, workflows)
    const invoices   = await seedInvoices(client, companies, debtors)
    const executions = await seedExecutions(client, invoices, workflows)
    await seedActionEvents(client, executions)
    await seedPayments(client, companies, invoices, debtors)
    await seedBankTransactions(client, companies)

    await client.query('COMMIT')
    console.log('\n✅ Seed complete.')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Seed failed — rolled back.', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
