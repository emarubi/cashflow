import { gql } from '@apollo/client'

export const GET_INVOICE = gql`
  query GetInvoice($id: ID!) {
    invoice(id: $id) {
      id
      number
      amount
      outstanding
      currency
      issueDate
      dueDate
      status
      paidAt
      debtor {
        id
        name
        email
        assignedUser {
          id
          name
        }
        workflow {
          id
          name
        }
      }
      execution {
        id
        status
        workflow {
          id
          name
        }
        currentAction {
          id
          channel
          stepOrder
          delayDays
          trigger
        }
        actionEvents {
          id
          triggeredAt
          result
          error
          metadata
          action {
            id
            channel
            stepOrder
          }
        }
      }
    }
  }
`
