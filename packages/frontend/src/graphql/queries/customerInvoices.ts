import { gql } from '@apollo/client'

export const GET_DEBTOR_INVOICES = gql`
  query GetDebtorInvoices($id: ID!, $first: Int, $after: String) {
    debtor(id: $id) {
      id
      invoices(first: $first, after: $after) {
        edges {
          cursor
          node {
            id
            number
            status
            dueDate
            outstanding
            amount
            currency
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
      }
    }
  }
`
