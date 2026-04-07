import { useQuery } from '@apollo/client'
import { GET_DASHBOARD } from '@/graphql/queries/dashboard'

interface TrendPoint {
  month: string
  value: number
}

interface TopDebtor {
  debtorId: string
  name: string
  outstanding: number
  invoiceCount: number
}

interface AgingBucket {
  label: string
  amount: number
  count: number
}

export interface DashboardData {
  totalUnpaid: number
  totalDue: number
  totalOverdue: number
  totalUnapplied: number
  dso: number
  riskRate: number
  dsoTrend: TrendPoint[]
  riskRateTrend: TrendPoint[]
  actionsToDoCount: number
  customersWithPaymentMethod: number
  topDebtors: TopDebtor[]
  agingBalance: AgingBucket[]
}

export function useDashboard() {
  const { data, loading, error } = useQuery<{ dashboard: DashboardData }>(GET_DASHBOARD)
  return { data: data?.dashboard ?? null, loading, error }
}
