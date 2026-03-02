interface PriceDisplayProps {
  amount: number
  currency?: string
  locale?: string
  className?: string
}

export default function PriceDisplay({
  amount,
  currency = 'EUR',
  locale = 'fr-LU',
  className,
}: PriceDisplayProps) {
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)

  return <span className={className}>{formatted}</span>
}
