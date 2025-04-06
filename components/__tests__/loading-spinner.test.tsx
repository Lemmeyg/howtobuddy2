import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from '../loading-spinner'

describe('LoadingSpinner', () => {
  it('renders with default size', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
    expect(spinner.firstChild).toHaveAttribute('size', '24')
  })

  it('renders with custom size', () => {
    render(<LoadingSpinner size={32} />)
    const spinner = screen.getByRole('status')
    expect(spinner.firstChild).toHaveAttribute('size', '32')
  })

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />)
    const spinner = screen.getByRole('status')
    expect(spinner.firstChild).toHaveClass('custom-class')
  })
}) 