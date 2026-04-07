import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'

const httpLink = createHttpLink({
  uri: '/graphql',
})

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('cashflow_token')
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  }
})

const errorLink = onError(({ graphQLErrors }) => {
  if (graphQLErrors?.some((e) => e.extensions?.code === 'UNAUTHENTICATED')) {
    localStorage.removeItem('cashflow_token')
    localStorage.removeItem('cashflow_user')
    localStorage.removeItem('cashflow_company')
    window.location.href = '/login'
  }
})

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        invoices: { keyArgs: ['filter'], merge: false },
        debtors: { keyArgs: ['filter'], merge: false },
        payments: { keyArgs: ['filter'], merge: false },
        bankTransactions: { keyArgs: ['filter'], merge: false },
        actionEvents: { keyArgs: ['filter'], merge: false },
      },
    },
  },
})

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache,
})

export default client
