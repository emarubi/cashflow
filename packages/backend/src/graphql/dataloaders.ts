import DataLoader from 'dataloader'
import { Pool } from 'pg'

// ─── Row types ────────────────────────────────────────────────────────────────

export interface UserRow {
  id: string
  company_id: string
  email: string
  name: string
  role: string
  created_at: Date
  updated_at: Date
}

export interface DebtorRow {
  id: string
  company_id: string
  name: string
  email: string | null
  rating: string | null
  has_payment_method: boolean
  assigned_user_id: string | null
  workflow_id: string | null
  created_at: Date
  updated_at: Date
}

export interface InvoiceRow {
  id: string
  company_id: string
  debtor_id: string
  number: string
  amount: string
  outstanding: string
  currency: string
  issue_date: Date
  due_date: Date
  status: string
  paid_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface WorkflowRow {
  id: string
  company_id: string
  name: string
  min_contact_delay_days: number
  first_action_logic: string
  reply_to: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date
  // Computed metrics — present on list() results, absent when loaded via DataLoader
  customer_count?: number | null
  performed_actions_count?: number
  email_open_rate?: number | null
  outstanding?: number | null
  dso?: number | null
}

export interface ActionRow {
  id: string
  workflow_id: string
  delay_days: number
  trigger: string
  channel: string
  template_id: string | null
  sender_name: string | null
  step_order: number
  created_at: Date
  updated_at: Date
}

export interface EmailTemplateRow {
  id: string
  company_id: string
  name: string
  subject: string
  body: string
  channel: string
  created_at: Date
  updated_at: Date
}

export interface ExecutionRow {
  id: string
  invoice_id: string
  workflow_id: string
  current_action_id: string | null
  status: string
  next_run_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface ActionEventRow {
  id: string
  execution_id: string
  action_id: string
  triggered_at: Date
  result: string
  error: string | null
  metadata: unknown
}

export interface PaymentRow {
  id: string
  company_id: string
  debtor_id: string | null
  invoice_id: string | null
  reference: string
  amount: string
  currency: string
  method: string | null
  source: string | null
  status: string
  received_at: Date
  created_at: Date
}

export interface CreditNoteRow {
  id: string
  company_id: string
  debtor_id: string | null
  invoice_id: string | null
  number: string
  title: string | null
  source: string | null
  currency: string
  amount: string
  amount_applied: string
  status: string
  issue_date: Date
  created_at: Date
  updated_at: Date
}

// ─── Loader factories ─────────────────────────────────────────────────────────

export function createLoaders(pool: Pool, companyId: string) {
  const userById = new DataLoader<string, UserRow | null>(async (ids) => {
    const { rows } = await pool.query<UserRow>(
      'SELECT id, company_id, email, name, role, created_at, updated_at FROM users WHERE id = ANY($1) AND company_id = $2',
      [ids as string[], companyId],
    )
    const map = new Map(rows.map((r) => [r.id, r]))
    return ids.map((id) => map.get(id) ?? null)
  })

  const debtorById = new DataLoader<string, DebtorRow | null>(async (ids) => {
    const { rows } = await pool.query<DebtorRow>(
      'SELECT id, company_id, name, email, rating, has_payment_method, assigned_user_id, workflow_id, created_at, updated_at FROM debtors WHERE id = ANY($1) AND company_id = $2',
      [ids as string[], companyId],
    )
    const map = new Map(rows.map((r) => [r.id, r]))
    return ids.map((id) => map.get(id) ?? null)
  })

  const invoiceById = new DataLoader<string, InvoiceRow | null>(async (ids) => {
    const { rows } = await pool.query<InvoiceRow>(
      'SELECT id, company_id, debtor_id, number, amount, outstanding, currency, issue_date, due_date, status, paid_at, created_at, updated_at FROM invoices WHERE id = ANY($1) AND company_id = $2',
      [ids as string[], companyId],
    )
    const map = new Map(rows.map((r) => [r.id, r]))
    return ids.map((id) => map.get(id) ?? null)
  })

  const workflowById = new DataLoader<string, WorkflowRow | null>(async (ids) => {
    const { rows } = await pool.query<WorkflowRow>(
      'SELECT id, company_id, name, min_contact_delay_days, first_action_logic, reply_to, is_active, created_at, updated_at FROM workflows WHERE id = ANY($1) AND company_id = $2',
      [ids as string[], companyId],
    )
    const map = new Map(rows.map((r) => [r.id, r]))
    return ids.map((id) => map.get(id) ?? null)
  })

  const actionById = new DataLoader<string, ActionRow | null>(async (ids) => {
    const { rows } = await pool.query<ActionRow>(
      'SELECT id, workflow_id, delay_days, trigger, channel, template_id, sender_name, step_order, created_at, updated_at FROM actions WHERE id = ANY($1)',
      [ids as string[]],
    )
    const map = new Map(rows.map((r) => [r.id, r]))
    return ids.map((id) => map.get(id) ?? null)
  })

  const emailTemplateById = new DataLoader<string, EmailTemplateRow | null>(async (ids) => {
    const { rows } = await pool.query<EmailTemplateRow>(
      'SELECT id, company_id, name, subject, body, channel, created_at, updated_at FROM email_templates WHERE id = ANY($1) AND company_id = $2',
      [ids as string[], companyId],
    )
    const map = new Map(rows.map((r) => [r.id, r]))
    return ids.map((id) => map.get(id) ?? null)
  })

  const executionById = new DataLoader<string, ExecutionRow | null>(async (ids) => {
    const { rows } = await pool.query<ExecutionRow>(
      `SELECT e.id, e.invoice_id, e.workflow_id, e.current_action_id, e.status, e.next_run_at, e.created_at, e.updated_at
       FROM executions e
       JOIN invoices i ON i.id = e.invoice_id
       WHERE e.id = ANY($1) AND i.company_id = $2`,
      [ids as string[], companyId],
    )
    const map = new Map(rows.map((r) => [r.id, r]))
    return ids.map((id) => map.get(id) ?? null)
  })

  const executionByInvoiceId = new DataLoader<string, ExecutionRow | null>(async (invoiceIds) => {
    const { rows } = await pool.query<ExecutionRow>(
      `SELECT e.id, e.invoice_id, e.workflow_id, e.current_action_id, e.status, e.next_run_at, e.created_at, e.updated_at
       FROM executions e
       JOIN invoices i ON i.id = e.invoice_id
       WHERE e.invoice_id = ANY($1) AND i.company_id = $2`,
      [invoiceIds as string[], companyId],
    )
    const map = new Map(rows.map((r) => [r.invoice_id, r]))
    return invoiceIds.map((id) => map.get(id) ?? null)
  })

  const actionsByWorkflowId = new DataLoader<string, ActionRow[]>(async (workflowIds) => {
    const { rows } = await pool.query<ActionRow>(
      'SELECT id, workflow_id, delay_days, trigger, channel, template_id, sender_name, step_order, created_at, updated_at FROM actions WHERE workflow_id = ANY($1) ORDER BY step_order',
      [workflowIds as string[]],
    )
    const map = new Map<string, ActionRow[]>()
    for (const row of rows) {
      const arr = map.get(row.workflow_id) ?? []
      arr.push(row)
      map.set(row.workflow_id, arr)
    }
    return workflowIds.map((id) => map.get(id) ?? [])
  })

  const actionEventsByExecutionId = new DataLoader<string, ActionEventRow[]>(async (executionIds) => {
    const { rows } = await pool.query<ActionEventRow>(
      'SELECT id, execution_id, action_id, triggered_at, result, error, metadata FROM action_events WHERE execution_id = ANY($1) ORDER BY triggered_at ASC',
      [executionIds as string[]],
    )
    const map = new Map<string, ActionEventRow[]>()
    for (const row of rows) {
      const arr = map.get(row.execution_id) ?? []
      arr.push(row)
      map.set(row.execution_id, arr)
    }
    return executionIds.map((id) => map.get(id) ?? [])
  })

  const paymentById = new DataLoader<string, PaymentRow | null>(async (ids) => {
    const { rows } = await pool.query<PaymentRow>(
      'SELECT id, company_id, debtor_id, invoice_id, reference, amount, currency, method, source, status, received_at, created_at FROM payments WHERE id = ANY($1) AND company_id = $2',
      [ids as string[], companyId],
    )
    const map = new Map(rows.map((r) => [r.id, r]))
    return ids.map((id) => map.get(id) ?? null)
  })

  const creditNoteById = new DataLoader<string, CreditNoteRow | null>(async (ids) => {
    const { rows } = await pool.query<CreditNoteRow>(
      `SELECT id, company_id, debtor_id, invoice_id, number, title, source, currency, amount, amount_applied, status, issue_date, created_at, updated_at
       FROM credit_notes WHERE id = ANY($1) AND company_id = $2`,
      [ids as string[], companyId],
    )
    const map = new Map(rows.map((r) => [r.id, r]))
    return ids.map((id) => map.get(id) ?? null)
  })

  const creditNotesByInvoiceId = new DataLoader<string, CreditNoteRow[]>(async (invoiceIds) => {
    const { rows } = await pool.query<CreditNoteRow>(
      `SELECT id, company_id, debtor_id, invoice_id, number, title, source, currency, amount, amount_applied, status, issue_date, created_at, updated_at
       FROM credit_notes WHERE invoice_id = ANY($1) AND company_id = $2`,
      [invoiceIds as string[], companyId],
    )
    const map = new Map<string, CreditNoteRow[]>()
    for (const row of rows) {
      if (!row.invoice_id) continue
      const arr = map.get(row.invoice_id) ?? []
      arr.push(row)
      map.set(row.invoice_id, arr)
    }
    return invoiceIds.map((id) => map.get(id) ?? [])
  })

  const invoicesByDebtorId = new DataLoader<string, InvoiceRow[]>(async (debtorIds) => {
    const { rows } = await pool.query<InvoiceRow>(
      'SELECT id, company_id, debtor_id, number, amount, outstanding, currency, issue_date, due_date, status, paid_at, created_at, updated_at FROM invoices WHERE debtor_id = ANY($1) AND company_id = $2 ORDER BY due_date DESC',
      [debtorIds as string[], companyId],
    )
    const map = new Map<string, InvoiceRow[]>()
    for (const row of rows) {
      const arr = map.get(row.debtor_id) ?? []
      arr.push(row)
      map.set(row.debtor_id, arr)
    }
    return debtorIds.map((id) => map.get(id) ?? [])
  })

  return {
    userById,
    debtorById,
    invoiceById,
    workflowById,
    actionById,
    emailTemplateById,
    executionById,
    executionByInvoiceId,
    actionsByWorkflowId,
    actionEventsByExecutionId,
    paymentById,
    invoicesByDebtorId,
    creditNoteById,
    creditNotesByInvoiceId,
  }
}
