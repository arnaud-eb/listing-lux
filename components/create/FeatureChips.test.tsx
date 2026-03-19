import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FeatureChips from './FeatureChips'

describe('FeatureChips', () => {
  it('renders all feature options', () => {
    render(<FeatureChips features={{}} onChange={vi.fn()} />)
    expect(screen.getByText('Balcony')).toBeInTheDocument()
    expect(screen.getByText('Parking')).toBeInTheDocument()
    expect(screen.getByText('Garden')).toBeInTheDocument()
    expect(screen.getByText('Elevator')).toBeInTheDocument()
    expect(screen.getByText('Storage/Cellar')).toBeInTheDocument()
    expect(screen.getByText('Pool')).toBeInTheDocument()
    expect(screen.getByText('Terrace')).toBeInTheDocument()
    expect(screen.getByText('Furnished')).toBeInTheDocument()
    expect(screen.getByText('New Build')).toBeInTheDocument()
    expect(screen.getByText('Renovated')).toBeInTheDocument()
    expect(screen.getByText('City View')).toBeInTheDocument()
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
