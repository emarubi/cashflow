import { useMutation } from '@apollo/client'
import { SEND_ACTION } from '@/graphql/mutations/execution'
import { GET_DEBTOR_ACTIVE_EXECUTIONS } from '@/graphql/queries/debtorActiveExecutions'
import { GET_ACTIONS_TO_DO_BY_DEBTOR } from '@/graphql/queries/actionsToDoByDebtor'

export function useSendAction(debtorId: string | null) {
  const [mutate, { loading, error }] = useMutation(SEND_ACTION, {
    refetchQueries: [
      { query: GET_DEBTOR_ACTIVE_EXECUTIONS, variables: { id: debtorId } },
      { query: GET_ACTIONS_TO_DO_BY_DEBTOR, variables: { first: 50 } },
    ],
  })

  function sendAction(executionId: string, actionId: string) {
    return mutate({ variables: { executionId, actionId } })
  }

  return { sendAction, loading, error }
}
