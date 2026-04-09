import { gql } from '@apollo/client'

export const SEND_ACTION = gql`
  mutation SendAction($executionId: ID!, $actionId: ID!) {
    sendAction(executionId: $executionId, actionId: $actionId) {
      id
      result
      triggeredAt
    }
  }
`

export const PAUSE_EXECUTION = gql`
  mutation PauseExecution($executionId: ID!) {
    pauseExecution(executionId: $executionId) {
      id
      status
      nextRunAt
    }
  }
`

export const RESUME_EXECUTION = gql`
  mutation ResumeExecution($executionId: ID!) {
    resumeExecution(executionId: $executionId) {
      id
      status
      nextRunAt
    }
  }
`

export const IGNORE_ACTION = gql`
  mutation IgnoreAction($executionId: ID!, $actionId: ID!) {
    ignoreAction(executionId: $executionId, actionId: $actionId) {
      id
      result
      triggeredAt
    }
  }
`
