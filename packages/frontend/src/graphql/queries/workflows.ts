import { gql } from '@apollo/client'

export const GET_WORKFLOWS = gql`
  query GetWorkflows {
    workflows {
      id
      name
      isActive
      firstActionLogic
      customerCount
      performedActionsCount
      emailOpenRate
      outstanding
      dso
    }
  }
`
