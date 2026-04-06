import { PoolClient } from 'pg'
import { uuid, batchInsert, randomItem, addDays } from './helpers'
import { InvoiceRecord } from './invoices'
import { WorkflowRecord, ActionRecord } from './workflows'

export interface ExecutionRecord {
  id: string
  invoiceId: string
  workflowId: string
  currentActionId: string
  currentStepOrder: number
  allActions: ActionRecord[]
}

export async function seedExecutions(
  client: PoolClient,
  invoices: InvoiceRecord[],
  workflows: WorkflowRecord[],
): Promise<ExecutionRecord[]> {
  // Only due and overdue invoices get an execution
  const unpaid = invoices.filter((i) => i.status === 'due' || i.status === 'overdue')

  // Build workflow lookup by company
  const workflowsByCompany = new Map<string, WorkflowRecord[]>()
  for (const w of workflows) {
    const arr = workflowsByCompany.get(w.companyId) ?? []
    arr.push(w)
    workflowsByCompany.set(w.companyId, arr)
  }

  const now = new Date()
  const columns = ['id', 'invoice_id', 'workflow_id', 'current_action_id', 'status', 'next_run_at']
  const rows: unknown[][] = []
  const all: ExecutionRecord[] = []

  for (const invoice of unpaid) {
    const companyWorkflows = workflowsByCompany.get(invoice.companyId) ?? []
    if (companyWorkflows.length === 0) continue

    const workflow = randomItem(companyWorkflows)
    // Sort actions by step_order
    const sortedActions = [...workflow.actions].sort((a, b) => a.stepOrder - b.stepOrder)
    if (sortedActions.length === 0) continue

    const id = uuid()

    // Pick a current step: overdue invoices are more advanced in the workflow
    let stepIdx = 0
    if (invoice.status === 'overdue') {
      stepIdx = Math.min(
        Math.floor(Math.random() * sortedActions.length),
        sortedActions.length - 1,
      )
    }
    const currentAction = sortedActions[stepIdx]

    // 30% of executions have next_run_at in the past (pending processing by scheduler)
    const isPending = Math.random() < 0.30
    const nextRunAt = isPending
      ? addDays(now, -Math.floor(Math.random() * 3)) // 0–3 days in the past
      : addDays(now, Math.floor(Math.random() * 7) + 1) // 1–7 days in the future

    rows.push([id, invoice.id, workflow.id, currentAction.id, 'active', nextRunAt.toISOString()])
    all.push({
      id,
      invoiceId: invoice.id,
      workflowId: workflow.id,
      currentActionId: currentAction.id,
      currentStepOrder: currentAction.stepOrder,
      allActions: sortedActions,
    })
  }

  await batchInsert(client, 'executions', columns, rows)
  console.log(`  ✓ executions: ${all.length}`)
  return all
}
