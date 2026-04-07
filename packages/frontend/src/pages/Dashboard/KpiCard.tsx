import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface KpiCardProps {
  value: number
  label: string
  sublabel: string
  variant: 'blue' | 'dark'
  ctaLabel?: string
  ctaTo?: string
  secondaryLabel?: string
  secondaryTo?: string
}

export default function KpiCard({
  value,
  label,
  sublabel,
  variant,
  ctaLabel,
  ctaTo,
  secondaryLabel,
  secondaryTo,
}: KpiCardProps) {
  const { t: _t } = useTranslation()

  const bg = variant === 'blue' ? 'bg-blue-600' : 'bg-gray-900'
  const text = 'text-white'

  return (
    <div className={`${bg} ${text} rounded-xl p-5 flex flex-col justify-between min-h-[130px]`}>
      <div>
        <p className="text-4xl font-bold">{value.toLocaleString()}</p>
        <p className="mt-1 text-sm font-medium opacity-90">{label}</p>
        <p className="mt-1 text-xs opacity-70">{sublabel}</p>
      </div>
      {(ctaLabel || secondaryLabel) && (
        <div className="mt-4 flex items-center gap-4 text-xs font-medium opacity-90">
          {ctaLabel && ctaTo && (
            <Link to={ctaTo} className="underline underline-offset-2 hover:opacity-100">
              {ctaLabel}
            </Link>
          )}
          {secondaryLabel && secondaryTo && (
            <Link to={secondaryTo} className="hover:opacity-100">
              {secondaryLabel} →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
