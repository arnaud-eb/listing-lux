import { formatCurrency } from "@/lib/format"

interface PriceDisplayProps {
  amount: number | null
  className?: string
}

export default function PriceDisplay({
  amount,
  className,
}: PriceDisplayProps) {
  if (amount == null) return null
  return <span className={className}>{formatCurrency(amount)}</span>
}
