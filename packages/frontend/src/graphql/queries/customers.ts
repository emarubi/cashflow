import { gql } from '@apollo/client'

export const GET_DEBTORS = gql`
  query GetDebtors($first: Int, $after: String, $filter: DebtorsFilterInput) {
    debtors(first: $first, after: $after, filter: $filter) {
      edges {
        cursor
        node {
          id
          name
          email
          rating
          hasPaymentMethod
          outstandingAmount
          assignedUser {
            id
            name
            role
          }
          workflow {
            id
            name
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`
