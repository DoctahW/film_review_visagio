import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { StarRating } from './star-rating'

function fillWidths(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>('[data-star-fill]'),
    (element) => element.style.width,
  )
}

function ControlledRating({ initial }: { initial: number | null }) {
  const [value, setValue] = useState(initial)
  return <StarRating value={value} onChange={setValue} />
}

describe('StarRating (só leitura)', () => {
  it('preenche 8 estrelas inteiras, 20% da nona e nada da décima para 8,2', () => {
    const { container } = render(<StarRating value={8.2} />)

    expect(fillWidths(container)).toEqual([...Array<string>(8).fill('100%'), '20%', '0%'])
  })

  it('descreve a nota em português e mostra o valor formatado', () => {
    render(<StarRating value={8.2} />)

    expect(screen.getByRole('img', { name: 'Nota 8,2 de 10' })).toHaveTextContent('8,2')
  })

  it('sem nota anuncia "Sem avaliações", mostra "—" e deixa todas as estrelas vazias', () => {
    const { container } = render(<StarRating value={null} />)

    expect(screen.getByRole('img', { name: 'Sem avaliações' })).toHaveTextContent('—')
    expect(fillWidths(container)).toEqual(Array<string>(10).fill('0%'))
  })
})

describe('StarRating (interativo)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('clique na metade esquerda da estrela i vale i − 0,5 e na direita vale i', () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 100, y: 0, width: 20, height: 20 }),
    )
    const onChange = vi.fn()
    const { container } = render(<StarRating value={null} onChange={onChange} />)
    const star7 = container.querySelector('[data-star="7"]')!

    fireEvent.click(star7, { clientX: 105 })
    fireEvent.click(star7, { clientX: 115 })

    expect(onChange.mock.calls).toEqual([[6.5], [7]])
  })

  it('passar o ponteiro pré-visualiza a nota sem alterá-la', () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 0, y: 0, width: 20, height: 20 }),
    )
    const onChange = vi.fn()
    const { container } = render(<StarRating value={2} onChange={onChange} />)
    const slider = screen.getByRole('slider')

    fireEvent.pointerMove(container.querySelector('[data-star="5"]')!, { clientX: 5 })
    expect(container).toHaveTextContent('4,5')

    fireEvent.pointerLeave(slider)
    expect(container).toHaveTextContent('2')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('expõe o valor como slider acessível', () => {
    render(<StarRating value={8.5} onChange={() => {}} />)

    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('aria-valuemin', '0')
    expect(slider).toHaveAttribute('aria-valuemax', '10')
    expect(slider).toHaveAttribute('aria-valuenow', '8.5')
    expect(slider).toHaveAttribute('aria-valuetext', '8,5 de 10')
  })

  it('setas andam 0,5; Home zera e End vai a 10', async () => {
    const user = userEvent.setup()
    render(<ControlledRating initial={5} />)
    const slider = screen.getByRole('slider')

    await user.click(slider)
    await user.keyboard('{ArrowRight}')
    expect(slider).toHaveAttribute('aria-valuenow', '5.5')
    await user.keyboard('{ArrowUp}')
    expect(slider).toHaveAttribute('aria-valuenow', '6')
    await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowDown}')
    expect(slider).toHaveAttribute('aria-valuenow', '4.5')
    await user.keyboard('{Home}')
    expect(slider).toHaveAttribute('aria-valuenow', '0')
    await user.keyboard('{End}')
    expect(slider).toHaveAttribute('aria-valuetext', '10 de 10')
  })

  it('não passa dos limites 0 e 10', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(<StarRating value={10} onChange={onChange} />)
    const slider = screen.getByRole('slider')

    slider.focus()
    await user.keyboard('{ArrowRight}{End}')
    expect(onChange).not.toHaveBeenCalled()

    rerender(<StarRating value={0} onChange={onChange} />)
    await user.keyboard('{ArrowLeft}{Home}')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('sem nota, a primeira seta para a direita vale 0,5', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<StarRating value={null} onChange={onChange} />)

    screen.getByRole('slider').focus()
    await user.keyboard('{ArrowRight}')

    expect(onChange).toHaveBeenCalledWith(0.5)
  })
})
