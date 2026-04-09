import { gql } from '@apollo/client'

export const GET_EMAIL_TEMPLATES = gql`
  query GetEmailTemplates {
    emailTemplates {
      id
      name
      subject
      body
      channel
    }
  }
`
