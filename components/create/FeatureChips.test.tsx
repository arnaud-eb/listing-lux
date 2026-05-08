import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FeatureChips from './FeatureChips'
import { FEATURE_OPTIONS } from '@/lib/constants'

describe('FeatureChips', () => {
  it('renders one chip per FEATURE_OPTIONS entry', () => {
    // Label rendering is delegated to next-intl's translation lookup; this test
    // therefore only asserts the chip count matches the canonical option list.
    // Translation correctness lives in messages/*.json + the i18n integration tests.
    render(<FeatureChips features={{}} onChange={vi.fn()} />)
    const chips = screen.getAllByRole('checkbox')
    expect(chips).toHaveLength(FEATURE_OPTIONS.length)
  })

  it('shows checked state for active features', () => {
    render(
      <FeatureChips
        features={{ balcony: true, parking: false }}
        onChange={vi.fn()}
      />
    )
    const balconyChip = screen.getByRole('checkbox', { name: /balcony/i })
    const parkingChip = screen.getByRole('checkbox', { name: /parking/i })
    expect(balconyChip).toHaveAttribute('aria-checked', 'true')
    expect(parkingChip).toHaveAttribute('aria-checked', 'false')
  })

  it('toggles chip on click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <FeatureChips features={{ balcony: false }} onChange={onChange} />
    )
    await user.click(screen.getByRole('checkbox', { name: /balcony/i }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ balcony: true })
    )
  })

  it('passes correct features object to onChange when toggling off', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <FeatureChips features={{ balcony: true, parking: true }} onChange={onChange} />
    )
    await user.click(screen.getByRole('checkbox', { name: /balcony/i }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ balcony: false, parking: true })
    )
  })
})
