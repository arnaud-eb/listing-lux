import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StepperInput from './StepperInput'

describe('StepperInput', () => {
  it('renders label and value', () => {
    render(
      <StepperInput
        id="bedrooms"
        label="Bedrooms"
        value={2}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText('Bedrooms')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('increments by 1 for integer step', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <StepperInput
        id="bedrooms"
        label="Bedrooms"
        value={2}
        onChange={onChange}
        min={0}
        max={10}
        step={1}
      />
    )
    await user.click(screen.getByLabelText('Increase Bedrooms'))
    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('decrements by 1 for integer step', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <StepperInput
        id="bedrooms"
        label="Bedrooms"
        value={3}
        onChange={onChange}
        min={0}
        max={10}
        step={1}
      />
    )
    await user.click(screen.getByLabelText('Decrease Bedrooms'))
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('increments by 0.5 for bathroom stepper', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <StepperInput
        id="bathrooms"
        label="Bathrooms"
        value={1}
        onChange={onChange}
        min={1}
        max={5}
        step={0.5}
      />
    )
    await user.click(screen.getByLabelText('Increase Bathrooms'))
    expect(onChange).toHaveBeenCalledWith(1.5)
  })

  it('does not go below min value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <StepperInput
        id="bedrooms"
        label="Bedrooms"
        value={0}
        onChange={onChange}
        min={0}
        max={10}
        step={1}
      />
    )
    const decrementBtn = screen.getByLabelText('Decrease Bedrooms')
    expect(decrementBtn).toBeDisabled()
    await user.click(decrementBtn)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not exceed max value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <StepperInput
        id="bedrooms"
        label="Bedrooms"
        value={10}
        onChange={onChange}
        min={0}
        max={10}
        step={1}
      />
    )
    const incrementBtn = screen.getByLabelText('Increase Bedrooms')
    expect(incrementBtn).toBeDisabled()
    await user.click(incrementBtn)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('displays decimal values for bathrooms', () => {
    render(
      <StepperInput
        id="bathrooms"
        label="Bathrooms"
        value={1.5}
        onChange={vi.fn()}
        step={0.5}
      />
    )
    expect(screen.getByText('1.5')).toBeInTheDocument()
  })
})
