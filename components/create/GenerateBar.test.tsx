import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GenerateBar from './GenerateBar'

describe('GenerateBar', () => {
  it('button is disabled when fewer than 5 photos are ready', () => {
    render(
      <GenerateBar
        readyPhotoCount={3}
        hasRequiredFields={true}
        onGenerate={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /generate listing/i })).toBeDisabled()
  })

  it('button is disabled when required form fields are empty', () => {
    render(
      <GenerateBar
        readyPhotoCount={5}
        hasRequiredFields={false}
        onGenerate={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /generate listing/i })).toBeDisabled()
  })

  it('button is disabled with 0 photos even with required fields', () => {
    render(
      <GenerateBar
        readyPhotoCount={0}
        hasRequiredFields={true}
        onGenerate={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /generate listing/i })).toBeDisabled()
  })

  it('button is enabled when all conditions are met', () => {
    render(
      <GenerateBar
        readyPhotoCount={5}
        hasRequiredFields={true}
        onGenerate={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /generate listing/i })).not.toBeDisabled()
  })

  it('calls onGenerate when button is clicked', async () => {
    const user = userEvent.setup()
    const onGenerate = vi.fn()
    render(
      <GenerateBar
        readyPhotoCount={5}
        hasRequiredFields={true}
        onGenerate={onGenerate}
      />
    )
    await user.click(screen.getByRole('button', { name: /generate listing/i }))
    expect(onGenerate).toHaveBeenCalledTimes(1)
  })

  it('shows loading state when isLoading is true', () => {
    render(
      <GenerateBar
        readyPhotoCount={5}
        hasRequiredFields={true}
        onGenerate={vi.fn()}
        isLoading={true}
      />
    )
    expect(screen.getByText(/generating/i)).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows correct language badges for active market', () => {
    render(
      <GenerateBar
        readyPhotoCount={5}
        hasRequiredFields={true}
        onGenerate={vi.fn()}
      />
    )
    // Luxembourg market has DE, FR, EN, LU
    expect(screen.getByText('de')).toBeInTheDocument()
    expect(screen.getByText('fr')).toBeInTheDocument()
    expect(screen.getByText('en')).toBeInTheDocument()
    expect(screen.getByText('lu')).toBeInTheDocument()
  })

  it('shows photo count hint when photos are insufficient', () => {
    render(
      <GenerateBar
        readyPhotoCount={2}
        hasRequiredFields={true}
        onGenerate={vi.fn()}
      />
    )
    expect(screen.getByText(/3 more photo/i)).toBeInTheDocument()
  })
})
