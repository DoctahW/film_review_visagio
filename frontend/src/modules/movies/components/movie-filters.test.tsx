import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { genreKeys } from '@/modules/genres'

import type { MovieSearch } from '../schemas/movie-search.schema'
import { MovieFilters } from './movie-filters'

// `fireEvent` (síncrono) em vez de `user-event`: o wrapper assíncrono do Testing Library só
// sabe avançar os timers falsos do Jest e travaria com os do Vitest.

const defaults: MovieSearch = { sort: 'popularidade', order: 'desc', page: 1 }

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient()
  queryClient.setQueryData(genreKeys.all, [{ sk_genre_id: '1', nome_genero: 'Drama' }])
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

function setup(search: Partial<MovieSearch> = {}) {
  const onSearchChange = vi.fn()
  const view = render(
    <MovieFilters search={{ ...defaults, ...search }} onSearchChange={onSearchChange} />,
    { wrapper },
  )
  const rerender = (next: Partial<MovieSearch>) =>
    view.rerender(
      <MovieFilters search={{ ...defaults, ...next }} onSearchChange={onSearchChange} />,
    )
  const searchInput = screen.getByRole('searchbox', { name: /Buscar filmes/ })
  const typeSearch = (value: string) => fireEvent.change(searchInput, { target: { value } })
  return { onSearchChange, rerender, searchInput, typeSearch }
}

const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms))

beforeEach(() => {
  vi.useFakeTimers()
  // O `Sheet` escolhe o layout por media query; o jsdom não implementa `matchMedia`.
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('MovieFilters', () => {
  it('envia a busca só 300 ms depois da última tecla, sem espaços nas pontas e na página 1', () => {
    const { onSearchChange, typeSearch } = setup({ page: 4 })

    typeSearch('ma')
    wait(200)
    typeSearch('  matrix ')
    wait(299)
    expect(onSearchChange).not.toHaveBeenCalled()

    wait(1)
    expect(onSearchChange).toHaveBeenCalledTimes(1)
    expect(onSearchChange).toHaveBeenCalledWith({ q: 'matrix', page: 1 })
  })

  it('não busca com menos de 2 caracteres e remove a busca anterior quando o texto encurta', () => {
    const { onSearchChange, typeSearch } = setup({ q: 'matrix' })

    typeSearch(' m ')
    wait(300)

    expect(onSearchChange).toHaveBeenCalledTimes(1)
    expect(onSearchChange).toHaveBeenCalledWith({ q: undefined, page: 1 })
    expect(screen.getByText(/pelo menos 2 caracteres/)).toBeInTheDocument()
  })

  it('acompanha uma busca trocada por fora sem reenviar a antiga', () => {
    const { onSearchChange, rerender, searchInput, typeSearch } = setup()

    typeSearch('matrix')
    wait(300)
    rerender({ q: 'matrix' })
    expect(searchInput).toHaveValue('matrix')
    onSearchChange.mockClear()

    // "Limpar filtros" / voltar no histórico: o campo esvazia e nada volta para a URL.
    rerender({})
    wait(300)

    expect(searchInput).toHaveValue('')
    expect(onSearchChange).not.toHaveBeenCalled()
  })

  it('só aplica o ano quando ele fica completo e válido', () => {
    const { onSearchChange } = setup({ page: 3 })
    const year = screen.getByRole('textbox', { name: 'Ano de lançamento' })

    fireEvent.change(year, { target: { value: '199' } })
    expect(onSearchChange).not.toHaveBeenCalled()

    fireEvent.change(year, { target: { value: '1999' } })
    expect(onSearchChange).toHaveBeenCalledTimes(1)
    expect(onSearchChange).toHaveBeenCalledWith({ ano: 1999, page: 1 })
  })
})
