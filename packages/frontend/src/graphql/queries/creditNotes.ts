import { gql } from '@apollo/client'

export const GET_CREDIT_NOTES = gql`
  query GetCreditNotes($first: Int, $after: String, $filter: CreditNotesFilterInput) {
    creditNotes(first: $first, after: $after, filter: $filter) {
      edges {
        cursor
        node {
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
          }
          invoice {
            id
            number
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`
