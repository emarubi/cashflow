import { useMutation } from '@apollo/client'
import { DELETE_ACTION } from '@/graphql/mutations/action'
import { GET_WORKFLOW } from '@/graphql/queries/workflow'

export function useDeleteAction(workflowId: string) {
  const [mutate, { loading, error }] = useMutation(DELETE_ACTION, {
    refetchQueries: [{ query: GET_WORKFLOW, variables: { id: workflowId } }],
  })

  const deleteAction = (id: string) =>
    mutate({ variables: { id } })

  return { deleteAction, loading, error }
}
