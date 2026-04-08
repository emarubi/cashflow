import { gql } from '@apollo/client'

export const GET_DEBTOR_PAYMENTS = gql`
  query GetDebtorPayments($first: Int, $after: String, $debtorId: ID!) {
    payments(first: $first, after: $after, filter: { debtorId: $debtorId }) {
      edges {
        cursor
        node {
          id
          reference
          status
          method
          amount
          currency
          receivedAt
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
