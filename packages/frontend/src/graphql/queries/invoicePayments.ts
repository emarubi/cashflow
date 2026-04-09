import { gql } from '@apollo/client'

export const GET_INVOICE_PAYMENTS = gql`
  query GetInvoicePayments($invoiceId: ID!) {
    payments(first: 50, filter: { invoiceId: $invoiceId }) {
      edges {
        node {
          id
          reference
          amount
          currency
          method
          source
          status
          receivedAt
        }
      }
      totalCount
    }
  }
`
