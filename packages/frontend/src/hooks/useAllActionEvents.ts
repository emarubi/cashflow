import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { GET_ALL_ACTION_EVENTS } from '@/graphql/queries/allActionEvents'

export interface AllActionEventAction {
  id: string
  channel: 'email' | 'call' | 'letter'
  delayDays: number
  trigger: 'before_due' | 'after_due' | 'on_issue'
  senderName: string | null
  template: { id: string; name: string; subject: string } | null
  workflow: { id: string; name: string } | null
}

export interface AllActionEventExecution {
  id: string
  status: string
  invoice: {
    id: string
    number: string
    outstanding: number
    dueDate: string
    status: string
    debtor: { id: string; name: string }
  }
}

export interface AllActionEvent {
  id: string
  triggeredAt: string
  result: 'sent' | 'failed' | 'skipped' | 'cancelled_paid'
  error: string | null
  action: AllActionEventAction | null
  execution: AllActionEventExecution | null
}

interface QueryResult {
  actionEvents: {
    edges: Array<{ cursor: string; node: AllActionEvent }>
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
    totalCount: number
  }
}

const PAGE_SIZE = 30

export function useAllActionEvents() {
  const [cursors, setCursors] = useState<string[]>([])
  const after = cursors.length > 0 ? cursors[cursors.length - 1] : undefined

  const { data, loading, error } = useQuery<QueryResult>(GET_ALL_ACTION_EVENTS, {
    variables: { first: PAGE_SIZE, after },
    fetchPolicy: 'cache-and-network',
  })

  const events = data?.actionEvents.edges.map((e) => e.node) ?? []
  const totalCount = data?.actionEvents.totalCount ?? 0
  const hasNextPage = data?.actionEvents.pageInfo.hasNextPage ?? false
  const endCursor = data?.actionEvents.pageInfo.endCursor ?? null

  const from = cursors.length * PAGE_SIZE + 1
  const to = Math.min((cursors.length + 1) * PAGE_SIZE, totalCount)

  function nextPage() {
    if (endCursor) setCursors((prev) => [...prev, endCursor])
  }

  function prevPage() {
    setCursors((prev) => prev.slice(0, -1))
  }

  return {
    events,
    totalCount,
    from,
    to,
    hasNextPage,
    hasPrevPage: cursors.length > 0,
    nextPage,
    prevPage,
    loading,
    error,
  }
}
