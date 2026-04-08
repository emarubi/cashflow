import { useQuery } from '@apollo/client'
import { GET_WORKFLOW_ACTION_STATS } from '@/graphql/queries/workflowActionStats'

export interface ActionStats {
  actionId: string
  performedActionsCount: number
  openRate: number | null
  collected: number
}

export type StatsMap = Record<string, ActionStats>

export function useWorkflowActionStats(
  workflowId: string,
  startDate: string,
  endDate: string,
) {
  const { data, loading, error, refetch } = useQuery<{ workflowActionStats: ActionStats[] }>(
    GET_WORKFLOW_ACTION_STATS,
    {
      variables: { workflowId, startDate, endDate },
      skip: !workflowId || !startDate || !endDate,
    },
  )

  const statsMap: StatsMap = {}
  for (const s of data?.workflowActionStats ?? []) {
    statsMap[s.actionId] = s
  }

  return { statsMap, loading, error, refetch }
}
