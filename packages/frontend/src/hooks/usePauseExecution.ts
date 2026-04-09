import { useMutation } from '@apollo/client'
import { PAUSE_EXECUTION } from '@/graphql/mutations/execution'
import { GET_DEBTOR_ACTIVE_EXECUTIONS } from '@/graphql/queries/debtorActiveExecutions'
import { GET_ACTIONS_TO_DO_BY_DEBTOR } from '@/graphql/queries/actionsToDoByDebtor'

export function usePauseExecution(debtorId: string | null) {
  const [mutate, { loading, error }] = useMutation(PAUSE_EXECUTION, {
    refetchQueries: [
      { query: GET_DEBTOR_ACTIVE_EXECUTIONS, variables: { id: debtorId } },
      { query: GET_ACTIONS_TO_DO_BY_DEBTOR, variables: { first: 50 } },
    ],
  })

  function pauseExecution(executionId: string) {
    return mutate({ variables: { executionId } })
  }

  return { pauseExecution, loading, error }
}
