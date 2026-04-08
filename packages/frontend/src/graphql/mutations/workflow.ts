import { gql } from '@apollo/client'

export const UPDATE_WORKFLOW = gql`
  mutation UpdateWorkflow($id: ID!, $input: UpdateWorkflowInput!) {
    updateWorkflow(id: $id, input: $input) {
      id
      name
      minContactDelayDays
      firstActionLogic
      replyTo
      isActive
    }
  }
`
