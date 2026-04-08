import { gql } from '@apollo/client'

export const GET_WORKFLOW = gql`
  query GetWorkflow($id: ID!) {
    workflow(id: $id) {
      id
      name
      isActive
      minContactDelayDays
      firstActionLogic
      replyTo
      actions {
        id
        stepOrder
        trigger
        channel
        delayDays
        senderName
        template {
          id
          name
          subject
        }
      }
    }
  }
`
