import { useQuery } from '@apollo/client'
import { GET_WORKFLOW } from '@/graphql/queries/workflow'

interface EmailTemplate {
  id: string
  name: string
  subject: string
}

export interface WorkflowAction {
  id: string
  stepOrder: number
  trigger: 'before_due' | 'after_due' | 'on_issue'
  channel: 'email' | 'call' | 'letter'
  delayDays: number
  senderName: string | null
  template: EmailTemplate | null
}

export interface WorkflowDetail {
  id: string
  name: string
  isActive: boolean
  minContactDelayDays: number
  firstActionLogic: 'standard' | 'contextualized'
  replyTo: string | null
  actions: WorkflowAction[]
}

export function useWorkflow(id: string) {
  const { data, loading, error } = useQuery<{ workflow: WorkflowDetail }>(GET_WORKFLOW, {
    variables: { id },
    skip: !id,
  })
  return { data: data?.workflow ?? null, loading, error }
}
