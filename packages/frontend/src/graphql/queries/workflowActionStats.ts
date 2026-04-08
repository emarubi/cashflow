import { gql } from '@apollo/client'

export const GET_WORKFLOW_ACTION_STATS = gql`
  query GetWorkflowActionStats($workflowId: ID!, $startDate: DateTime!, $endDate: DateTime!) {
    workflowActionStats(workflowId: $workflowId, startDate: $startDate, endDate: $endDate) {
      actionId
      performedActionsCount
      openRate
      collected
    }
  }
`
