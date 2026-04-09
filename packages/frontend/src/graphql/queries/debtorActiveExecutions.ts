import { gql } from '@apollo/client'

export const GET_DEBTOR_ACTIVE_EXECUTIONS = gql`
  query GetDebtorActiveExecutions($id: ID!) {
    debtor(id: $id) {
      id
      name
      email
      outstandingAmount
      overdueAmount
      nextActionDate
      lastContactedAt
      assignedUser {
        id
        name
      }
      workflow {
        id
        name
      }
      invoices(first: 100) {
        edges {
          node {
            id
            number
            amount
            outstanding
            currency
            dueDate
            status
            execution {
              id
              status
              nextRunAt
              currentAction {
                id
                channel
                delayDays
                trigger
                senderName
                isAutomatic
                template {
                  id
                  name
                  subject
                  body
                }
              }
            }
          }
        }
      }
    }
  }
`
