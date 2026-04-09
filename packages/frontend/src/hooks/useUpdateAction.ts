import { useMutation } from '@apollo/client'
import { UPDATE_ACTION } from '@/graphql/mutations/action'
import { GET_WORKFLOW } from '@/graphql/queries/workflow'

interface UpdateActionInput {
  delayDays?: number
  trigger?: string
  channel?: string
  senderName?: string
  isAutomatic?: boolean
  templateName?: string
  templateSubject?: string
  templateBody?: string
}

export function useUpdateAction(workflowId: string) {
  const [mutate, { loading, error }] = useMutation(UPDATE_ACTION, {
    refetchQueries: [{ query: GET_WORKFLOW, variables: { id: workflowId } }],
  })

  const updateAction = (id: string, input: UpdateActionInput) =>
    mutate({ variables: { id, input } })

  return { updateAction, loading, error }
}
