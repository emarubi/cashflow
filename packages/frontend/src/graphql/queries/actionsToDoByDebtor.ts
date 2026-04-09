import { gql } from '@apollo/client'

export const GET_ACTIONS_TO_DO_BY_DEBTOR = gql`
  query GetActionsToDoByDebtor($first: Int, $after: String, $search: String, $sort: DebtorSort) {
    debtors(
      first: $first
      after: $after
      filter: { search: $search, hasActiveExecution: true }
      sort: $sort
    ) {
      edges {
        cursor
        node {
          id
          name
          email
          outstandingAmount
          overdueAmount
          nextActionDate
          assignedUser {
            id
            name
          }
          workflow {
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
