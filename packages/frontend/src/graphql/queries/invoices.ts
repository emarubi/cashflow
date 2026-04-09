import { gql } from '@apollo/client'

export const GET_INVOICES = gql`
  query GetInvoices($first: Int, $after: String, $filter: InvoicesFilterInput) {
    invoices(first: $first, after: $after, filter: $filter) {
      edges {
        cursor
        node {
          id
          number
          status
          issueDate
          dueDate
          amount
          outstanding
          currency
          debtor {
            id
            name
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
