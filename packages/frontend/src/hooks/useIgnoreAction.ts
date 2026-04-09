import { useMutation } from '@apollo/client'
import { IGNORE_ACTION } from '@/graphql/mutations/execution'
import { GET_DEBTOR_ACTIVE_EXECUTIONS } from '@/graphql/queries/debtorActiveExecutions'
import { GET_ACTIONS_TO_DO_BY_DEBTOR } from '@/graphql/queries/actionsToDoByDebtor'

export function useIgnoreAction(debtorId: string | null) {
  const [mutate, { loading, error }] = useMutation(IGNORE_ACTION, {
    refetchQueries: [
      { query: GET_DEBTOR_ACTIVE_EXECUTIONS, variables: { id: debtorId } },
      { query: GET_ACTIONS_TO_DO_BY_DEBTOR, variables: { first: 50 } },
    ],
  })

  function ignoreAction(executionId: string, actionId: string) {
    return mutate({ variables: { executionId, actionId } })
  }

  return { ignoreAction, loading, error }
}
