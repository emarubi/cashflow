import { useQuery } from '@apollo/client'
import { GET_DEBTOR_ACTIVE_EXECUTIONS } from '@/graphql/queries/debtorActiveExecutions'

export interface ActiveExecutionAction {
  id: string
  channel: 'email' | 'call' | 'letter'
  delayDays: number
  trigger: 'before_due' | 'after_due' | 'on_issue'
  senderName: string | null
  isAutomatic: boolean
  template: { id: string; name: string; subject: string; body: string } | null
}

export interface ActiveExecution {
  id: string
  status: string
  nextRunAt: string | null
  currentAction: ActiveExecutionAction | null
}

export interface ActiveInvoice {
  id: string
  number: string
  amount: number
  outstanding: number
  currency: string
  dueDate: string
  status: string
  execution: ActiveExecution | null
}

export interface DebtorWithExecutions {
  id: string
  name: string
  email: string | null
  outstandingAmount: number
  overdueAmount: number
  nextActionDate: string | null
  lastContactedAt: string | null
  assignedUser: { id: string; name: string } | null
  workflow: { id: string; name: string } | null
  invoices: { edges: Array<{ node: ActiveInvoice }> }
}

interface QueryResult {
  debtor: DebtorWithExecutions
}

export function useDebtorActiveExecutions(id: string | null) {
  const { data, loading, error, refetch } = useQuery<QueryResult>(GET_DEBTOR_ACTIVE_EXECUTIONS, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  })

  const debtor = data?.debtor ?? null

  const activeInvoices = debtor?.invoices.edges
    .map((e) => e.node)
    .filter((inv) => inv.execution?.status === 'active' && inv.execution.currentAction) ?? []

  return { debtor, activeInvoices, loading, error, refetch }
}
