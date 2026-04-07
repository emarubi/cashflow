import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useTranslation } from 'react-i18next'

interface AgingBucket {
  label: string
  amount: number
  count: number
}

interface AgingBalanceChartProps {
  buckets: AgingBucket[]
}

const BUCKET_COLORS = ['#3b82f6', '#60a5fa', '#f97316', '#ef4444']

function formatAmountShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toFixed(0)
}

export default function AgingBalanceChart({ buckets }: AgingBalanceChartProps) {
  const { t } = useTranslation()

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('dashboard.aging_balance')}</h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={buckets} barSize={28}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatAmountShort}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            formatter={(value) =>
              typeof value === 'number'
                ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
                : value
            }
            cursor={{ fill: '#f3f4f6' }}
          />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
            {buckets.map((_bucket, index) => (
              <Cell key={index} fill={BUCKET_COLORS[index % BUCKET_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
