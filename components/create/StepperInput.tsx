'use client'

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
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="w-10 h-10 rounded-l-md border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          −
        </button>
        <div
          id={id}
          className="w-14 h-10 border-t border-b border-gray-300 bg-white flex items-center justify-center text-[#1a2332] font-semibold text-sm"
          aria-live="polite"
          aria-atomic="true"
        >
          {value % 1 === 0 ? value : value.toFixed(1)}
        </div>
        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="w-10 h-10 rounded-r-md border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          +
        </button>
      </div>
    </div>
  )
}
