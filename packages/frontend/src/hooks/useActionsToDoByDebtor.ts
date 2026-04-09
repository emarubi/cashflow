import { useQuery } from '@apollo/client'
import { GET_ACTIONS_TO_DO_BY_DEBTOR } from '@/graphql/queries/actionsToDoByDebtor'

export type ActionToDoSort = 'OUTSTANDING_DESC' | 'OVERDUE_DESC' | 'NEXT_ACTION_DATE_ASC'

export interface ActionToDoDebtor {
  id: string
  name: string
  email: string | null
  outstandingAmount: number
  overdueAmount: number
  nextActionDate: string | null
  assignedUser: { id: string; name: string } | null
  workflow: { id: string; name: string } | null
}

interface QueryResult {
  debtors: {
    edges: Array<{ cursor: string; node: ActionToDoDebtor }>
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
    totalCount: number
  }
}

const PAGE_SIZE = 50

export function useActionsToDoByDebtor(search?: string, sort?: ActionToDoSort) {
  const { data, loading, error, refetch } = useQuery<QueryResult>(GET_ACTIONS_TO_DO_BY_DEBTOR, {
    variables: {
      first: PAGE_SIZE,
      search: search || undefined,
      sort: sort ?? null,
    },
    fetchPolicy: 'cache-and-network',
  })

  const debtors = data?.debtors.edges.map((e) => e.node) ?? []
  const totalCount = data?.debtors.totalCount ?? 0

  return { debtors, totalCount, loading, error, refetch }
}
