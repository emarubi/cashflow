import { useMutation } from '@apollo/client'
import { UPDATE_WORKFLOW } from '@/graphql/mutations/workflow'
import { GET_WORKFLOW } from '@/graphql/queries/workflow'

interface UpdateWorkflowInput {
  name?: string
  minContactDelayDays?: number
  firstActionLogic?: string
  replyTo?: string | null
  isActive?: boolean
}

export function useUpdateWorkflow(workflowId: string) {
  const [mutate, { loading, error }] = useMutation(UPDATE_WORKFLOW, {
    refetchQueries: [{ query: GET_WORKFLOW, variables: { id: workflowId } }],
  })

  const updateWorkflow = (input: UpdateWorkflowInput) =>
    mutate({ variables: { id: workflowId, input } })

  return { updateWorkflow, loading, error }
}
