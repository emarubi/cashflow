import { gql } from '@apollo/client'

export const CREATE_ACTION = gql`
  mutation CreateAction($input: CreateActionInput!) {
    createAction(input: $input) {
      id
      workflowId
      delayDays
      trigger
      channel
      senderName
      isAutomatic
      stepOrder
      template {
        id
        name
        subject
        body
      }
    }
  }
`

export const SEND_TEST_EMAIL = gql`
  mutation SendTestEmail($input: SendTestEmailInput!) {
    sendTestEmail(input: $input)
  }
`
