'use client'

import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StepperInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label: string
  id: string
}

export default function StepperInput({
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  label,
  id,
}: StepperInputProps) {
  function decrement() {
    const next = Math.round((value - step) * 10) / 10
    if (next >= min) onChange(next)
  }

  function increment() {
    const next = Math.round((value + step) * 10) / 10
    if (next <= max) onChange(next)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="flex items-center gap-0">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={decrement}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="w-11 h-11 rounded-l-md rounded-r-none border-gray-300 bg-white text-gray-600 hover:bg-gray-50 shadow-none disabled:opacity-40"
        >
          <Minus className="size-4" />
        </Button>
        <div
          id={id}
          className="w-14 h-11 border-t border-b border-gray-300 bg-white flex items-center justify-center text-navy-deep font-semibold text-sm"
          aria-live="polite"
          aria-atomic="true"
        >
          {value % 1 === 0 ? value : value.toFixed(1)}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={increment}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="w-11 h-11 rounded-r-md rounded-l-none border-gray-300 bg-white text-gray-600 hover:bg-gray-50 shadow-none disabled:opacity-40"
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  )
}
