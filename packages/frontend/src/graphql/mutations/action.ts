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

export const UPDATE_ACTION = gql`
  mutation UpdateAction($id: ID!, $input: UpdateActionInput!) {
    updateAction(id: $id, input: $input) {
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

export const DELETE_ACTION = gql`
  mutation DeleteAction($id: ID!) {
    deleteAction(id: $id)
  }
`

export const SEND_TEST_EMAIL = gql`
  mutation SendTestEmail($input: SendTestEmailInput!) {
    sendTestEmail(input: $input)
  }
`
