import { useQuery } from '@apollo/client'
import { useState } from 'react'
import { GET_CREDIT_NOTES } from '@/graphql/queries/creditNotes'

interface CreditNotesFilter {
  debtorId?: string
  status?: string
  currency?: string
  search?: string
}

const PAGE_SIZE = 20

export function useCreditNotes(filter?: CreditNotesFilter) {
  const [cursors, setCursors] = useState<string[]>([])

  const after = cursors.length > 0 ? cursors[cursors.length - 1] : undefined

  const { data, loading, error } = useQuery(GET_CREDIT_NOTES, {
    variables: { first: PAGE_SIZE, after, filter: filter ?? {} },
    fetchPolicy: 'cache-and-network',
  })

  const connection = data?.creditNotes
  const edges = connection?.edges ?? []
  const pageInfo = connection?.pageInfo
  const totalCount = connection?.totalCount ?? 0

  function nextPage() {
    if (pageInfo?.endCursor) setCursors((prev) => [...prev, pageInfo.endCursor])
  }

  function prevPage() {
    setCursors((prev) => prev.slice(0, -1))
  }

  const currentPage = cursors.length + 1
  const from = (currentPage - 1) * PAGE_SIZE + 1
  const to = Math.min(currentPage * PAGE_SIZE, totalCount)

  return {
    creditNotes: edges.map((e: { node: unknown }) => e.node),
    loading,
    error,
    totalCount,
    from,
    to,
    hasNextPage: pageInfo?.hasNextPage ?? false,
    hasPrevPage: cursors.length > 0,
    nextPage,
    prevPage,
  }
}
