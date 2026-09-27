import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Pagination, paginationRange } from './pagination'

describe('paginationRange', () => {
  it('mostra todas as páginas quando são poucas', () => {
    expect(paginationRange(1, 1)).toEqual([1])
    expect(paginationRange(1, 2)).toEqual([1, 2])
    expect(paginationRange(3, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('não tem páginas quando o total é zero', () => {
    expect(paginationRange(1, 0)).toEqual([])
  })

  it('na primeira e na última página mantém o outro extremo depois das reticências', () => {
    expect(paginationRange(1, 10)).toEqual([1, 2, 'ellipsis', 10])
    expect(paginationRange(10, 10)).toEqual([1, 'ellipsis', 9, 10])
  })

  it('no meio mostra a atual ±1 entre reticências', () => {
    expect(paginationRange(5, 10)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10])
  })

  it('mostra o número em vez de reticências que esconderiam uma página só', () => {
    expect(paginationRange(4, 10)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 10])
    expect(paginationRange(7, 10)).toEqual([1, 'ellipsis', 6, 7, 8, 9, 10])
  })

  it('limita uma página fora do intervalo', () => {
    expect(paginationRange(99, 3)).toEqual([1, 2, 3])
    expect(paginationRange(0, 3)).toEqual([1, 2, 3])
  })
})

describe('Pagination', () => {
  it('desabilita "anterior" na primeira página e marca a atual', () => {
    render(<Pagination page={1} pages={5} onPageChange={() => {}} />)

    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
  })

  it('desabilita "próxima" na última página', () => {
    render(<Pagination page={5} pages={5} onPageChange={() => {}} />)

    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled()
  })

  it('navega pelas setas e pelos números', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Pagination page={3} pages={10} onPageChange={onPageChange} />)

    await user.click(screen.getByRole('button', { name: 'Próxima página' }))
    await user.click(screen.getByRole('button', { name: 'Página anterior' }))
    await user.click(screen.getByRole('button', { name: 'Página 10' }))

    expect(onPageChange.mock.calls).toEqual([[4], [2], [10]])
  })
})
