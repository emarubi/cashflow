import { useQuery } from '@apollo/client'
import { GET_INVOICE } from '@/graphql/queries/invoice'

export function useInvoice(id: string) {
  const { data, loading, error } = useQuery(GET_INVOICE, {
    variables: { id },
    skip: !id,
  })

  return {
    invoice: data?.invoice ?? null,
    loading,
    error,
  }
}
