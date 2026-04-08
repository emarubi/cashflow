import { gql } from '@apollo/client'

export const GET_DEBTOR = gql`
  query GetDebtor($id: ID!) {
    debtor(id: $id) {
      id
      name
      email
      rating
      hasPaymentMethod
      outstandingAmount
      avgPaymentDelayDays
      lastContactedAt
      assignedUser {
        id
        name
        role
      }
      workflow {
        id
        name
        isActive
      }
    }
  }
`
