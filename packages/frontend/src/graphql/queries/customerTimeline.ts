import { gql } from '@apollo/client'

export const GET_DEBTOR_TIMELINE = gql`
  query GetDebtorTimeline($first: Int, $after: String, $debtorId: ID!) {
    actionEvents(first: $first, after: $after, filter: { debtorId: $debtorId }) {
      edges {
        cursor
        node {
          id
          triggeredAt
          result
          action {
            id
            channel
            delayDays
            trigger
          }
          execution {
            id
            invoice {
              id
              number
              amount
              currency
            }
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
