import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DesignSurfaceSample } from './DesignSurfaceSample'

describe('DesignSurfaceSample', () => {
  it('renders semantic token utility classes from the theme pipeline', () => {
    const { container } = render(<DesignSurfaceSample />)
    const el = screen.getByTestId('design-surface-sample')
    expect(el).toHaveClass('bg-surface-panel')
    expect(el).toHaveClass('text-fg-secondary')
    expect(container.firstChild).toBeTruthy()
  })
})
