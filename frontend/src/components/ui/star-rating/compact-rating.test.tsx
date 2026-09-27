import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CompactRating } from './compact-rating'

describe('CompactRating', () => {
  it('mostra nota na escala, quantidade no singular e no plural', () => {
    const { container, rerender } = render(<CompactRating value={5.3} count={1} />)
    expect(screen.getByText('Nota 5,3 de 10, 1 avaliação')).toBeInTheDocument()
    expect(container).toHaveTextContent(/5,3\/10\s*· 1 avaliação/)

    rerender(<CompactRating value={8} count={1234} variant="short" />)
    expect(screen.getByText('Nota 8 de 10, 1.234 avaliações')).toBeInTheDocument()
    expect(container).toHaveTextContent(/8\/10\s*\(1\.234\)/)
  })

  it('sem média não inventa nota', () => {
    render(<CompactRating value={null} count={0} />)
    expect(screen.getByText('Sem avaliações')).toBeInTheDocument()
    expect(screen.queryByText(/Nota/)).not.toBeInTheDocument()
  })
})
