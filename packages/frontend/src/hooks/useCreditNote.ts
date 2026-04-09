import { useQuery } from '@apollo/client'
import { GET_CREDIT_NOTE } from '@/graphql/queries/creditNote'

export function useCreditNote(id: string) {
  const { data, loading, error } = useQuery(GET_CREDIT_NOTE, {
    variables: { id },
    skip: !id,
  })

  return {
    creditNote: data?.creditNote ?? null,
    loading,
    error,
  }
}
