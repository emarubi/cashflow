import { gql } from '@apollo/client'

export const GET_ALL_ACTION_EVENTS = gql`
  query GetAllActionEvents($first: Int, $after: String, $filter: ActionEventsFilterInput) {
    actionEvents(first: $first, after: $after, filter: $filter) {
      edges {
        cursor
        node {
          id
          triggeredAt
          result
          error
          action {
            id
            channel
            delayDays
            trigger
            senderName
            template {
              id
              name
              subject
            }
            workflow {
              id
              name
            }
          }
          execution {
            id
            status
            invoice {
              id
              number
              outstanding
              dueDate
              status
              debtor {
                id
                name
              }
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
