import { gql } from '@apollo/client'

export const GET_CREDIT_NOTE = gql`
  query GetCreditNote($id: ID!) {
    creditNote(id: $id) {
      id
      number
      title
      source
      currency
      amount
      amountApplied
      status
      issueDate
      debtor {
        id
        name
        email
      }
      invoice {
        id
        number
        issueDate
        amount
        currency
        debtor {
          id
          name
        }
      }
    }
  }
`
