import { gql } from '@apollo/client'

export const GET_DASHBOARD = gql`
  query GetDashboard {
    dashboard {
      totalUnpaid
      totalDue
      totalOverdue
      totalUnapplied
      dso
      riskRate
      dsoTrend {
        month
        value
      }
      riskRateTrend {
        month
        value
      }
      actionsToDoCount
      customersWithPaymentMethod
      topDebtors {
        debtorId
        name
        outstanding
        invoiceCount
      }
      agingBalance {
        label
        amount
        count
      }
    }
  }
`
