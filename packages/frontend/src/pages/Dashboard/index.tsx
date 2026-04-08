import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useDashboard } from '@/hooks/useDashboard'
import GreetingBlock from './GreetingBlock'
import KpiCard from './KpiCard'
import OutstandingCard from './OutstandingCard'
import TrendCard from './TrendCard'
import TopDebtorsList from './TopDebtorsList'
import AgingBalanceChart from './AgingBalanceChart'

function computeTrend(trend: { month: string; value: number }[]): number {
  if (trend.length < 2) return 0
  const prev = trend[trend.length - 2].value
  const curr = trend[trend.length - 1].value
  if (prev === 0) return 0
  return ((curr - prev) / prev) * 100
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { companySlug } = useParams<{ companySlug: string }>()
  const slug = companySlug ?? ''
  const { data, loading, error } = useDashboard()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        {t('common.loading')}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full text-red-500 text-sm">
        {t('common.error')}
      </div>
    )
  }

  const dsoTrend = computeTrend(data.dsoTrend)
  const riskTrend = computeTrend(data.riskRateTrend)

  return (
    <div className="p-6 space-y-5">
      {/* Row 1: greeting + 2 KPI cards */}
      <div className="grid grid-cols-3 gap-5">
        <GreetingBlock />

        <KpiCard
          value={data.actionsToDoCount}
          label={t('dashboard.actions_todo')}
          sublabel={t('dashboard.actions_sublabel')}
          variant="blue"
          ctaLabel={t('dashboard.recover_unpaid_invoices')}
          ctaTo={`/${slug}/actions`}
          secondaryLabel={t('dashboard.edit_workflows')}
          secondaryTo={`/${slug}/workflows`}
        />

        <KpiCard
          value={data.customersWithPaymentMethod}
          label={t('dashboard.payment_methods')}
          sublabel=""
          variant="dark"
          secondaryLabel={t('dashboard.see_fast_launch')}
          secondaryTo={`/${slug}/customers`}
        />
      </div>

      {/* Row 2: outstanding + DSO + risk rate */}
      <div className="grid grid-cols-3 gap-5">
        <OutstandingCard
          totalUnpaid={data.totalUnpaid}
          totalDue={data.totalDue}
          totalOverdue={data.totalOverdue}
          totalUnapplied={data.totalUnapplied}
        />

        <TrendCard
          label={t('dashboard.dso')}
          value={Math.round(data.dso)}
          unit={t('dashboard.dso_unit')}
          trend={dsoTrend}
          trendData={data.dsoTrend}
        />

        <TrendCard
          label={t('dashboard.risk_rate')}
          value={Math.round(data.riskRate)}
          unit="%"
          trend={riskTrend}
          trendData={data.riskRateTrend}
        />
      </div>

      {/* Row 3: top debtors + aging balance */}
      <div className="grid grid-cols-2 gap-5">
        <TopDebtorsList debtors={data.topDebtors} />
        <AgingBalanceChart buckets={data.agingBalance} />
      </div>
    </div>
  )
}
