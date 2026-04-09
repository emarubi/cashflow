import { useQuery } from '@apollo/client'
import { GET_INVOICE_PAYMENTS } from '@/graphql/queries/invoicePayments'

export function useInvoicePayments(invoiceId: string) {
  const { data, loading, error } = useQuery(GET_INVOICE_PAYMENTS, {
    variables: { invoiceId },
    skip: !invoiceId,
  })

  const edges = data?.payments?.edges ?? []

  return {
    payments: edges.map((e: { node: unknown }) => e.node),
    totalCount: data?.payments?.totalCount ?? 0,
    loading,
    error,
  }
}
