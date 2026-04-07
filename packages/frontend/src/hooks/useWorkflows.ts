import { useQuery } from '@apollo/client'
import { GET_WORKFLOWS } from '@/graphql/queries/workflows'

export interface WorkflowItem {
  id: string
  name: string
  isActive: boolean
  firstActionLogic: string
  customerCount: number | null
  performedActionsCount: number | null
  emailOpenRate: number | null
  outstanding: number | null
  dso: number | null
}

export function useWorkflows() {
  const { data, loading, error } = useQuery<{ workflows: WorkflowItem[] }>(GET_WORKFLOWS)
  return { data: data?.workflows ?? null, loading, error }
}
