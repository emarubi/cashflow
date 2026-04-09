import { useMutation } from '@apollo/client'
import { CREATE_ACTION } from '@/graphql/mutations/action'
import { GET_WORKFLOW } from '@/graphql/queries/workflow'

interface CreateActionInput {
  workflowId: string
  delayDays: number
  trigger: string
  channel: string
  senderName?: string
  isAutomatic?: boolean
  templateName: string
  templateSubject: string
  templateBody: string
}

export function useCreateAction(workflowId: string) {
  const [mutate, { loading, error }] = useMutation(CREATE_ACTION, {
    refetchQueries: [{ query: GET_WORKFLOW, variables: { id: workflowId } }],
  })

  const createAction = (input: CreateActionInput) =>
    mutate({ variables: { input } })

  return { createAction, loading, error }
}
