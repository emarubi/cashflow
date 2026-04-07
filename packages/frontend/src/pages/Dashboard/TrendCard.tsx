import { BarChart, Bar, ResponsiveContainer } from 'recharts'

interface TrendPoint {
  month: string
  value: number
}

interface TrendCardProps {
  label: string
  value: number
  unit: string
  trend: number
  trendData: TrendPoint[]
}

export default function TrendCard({ label, value, unit, trend, trendData }: TrendCardProps) {
  const isPositive = trend >= 0
  const trendColor = isPositive ? 'text-red-500' : 'text-green-500'
  const trendSign = isPositive ? '▲' : '▼'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-1 text-3xl font-bold text-gray-900">
          {value.toLocaleString()}
          <span className="ml-1 text-base font-normal text-gray-500">{unit}</span>
        </p>
        <p className={`mt-1 text-xs font-medium ${trendColor}`}>
          {trendSign} {Math.abs(trend).toFixed(2)}%
        </p>
      </div>
      <div className="w-24 h-16 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trendData} barSize={6}>
            <Bar dataKey="value" fill="#d1d5db" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
