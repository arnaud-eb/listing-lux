import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import GenerateBar from './GenerateBar'

describe('GenerateBar', () => {
  const buttonName = /generate listing/i

  it('button is disabled when fewer than 5 photos are ready', () => {
    render(
      <GenerateBar readyPhotoCount={3} hasRequiredFields={true} />
    )
    expect(screen.getByRole('button', { name: buttonName })).toBeDisabled()
  })

  it('button is disabled when required form fields are empty', () => {
    render(
      <GenerateBar readyPhotoCount={5} hasRequiredFields={false} />
    )
    expect(screen.getByRole('button', { name: buttonName })).toBeDisabled()
  })

  it('button is disabled with 0 photos even with required fields', () => {
    render(
      <GenerateBar readyPhotoCount={0} hasRequiredFields={true} />
    )
    expect(screen.getByRole('button', { name: buttonName })).toBeDisabled()
  })

  it('button is enabled when all conditions are met', () => {
    render(
      <GenerateBar readyPhotoCount={5} hasRequiredFields={true} />
    )
    expect(screen.getByRole('button', { name: buttonName })).not.toBeDisabled()
  })

  it('renders as submit button', () => {
    render(
      <GenerateBar readyPhotoCount={5} hasRequiredFields={true} />
    )
    expect(screen.getByRole('button', { name: buttonName })).toHaveAttribute('type', 'submit')
  })

  it('shows loading state when isLoading is true', () => {
    render(
      <GenerateBar readyPhotoCount={5} hasRequiredFields={true} isLoading={true} />
    )
    expect(screen.getByText(/generating/i)).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows photo count hint when photos are insufficient', () => {
    render(
      <GenerateBar readyPhotoCount={2} hasRequiredFields={true} />
    )
    expect(screen.getByText(/3 more photo/i)).toBeInTheDocument()
  })
})
