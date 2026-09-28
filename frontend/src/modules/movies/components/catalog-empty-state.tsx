import { FileQuestion, SearchX } from 'lucide-react'

import { StateMessage } from '@/components/state-message'
import { Button } from '@/components/ui/button'

import type { MovieSearch } from '../schemas/movie-search.schema'
import { clearedMovieSearch, hasActiveFilters } from './catalog-search-state'

type CatalogEmptyStateProps = {
  search: MovieSearch
  /** Total da busca: maior que zero com a página vazia = página além da última. */
  total: number
  onSearchChange: (next: Partial<MovieSearch>) => void
  className?: string
}

/** Busca sem resultados (com "Limpar filtros") ou página inexistente (link antigo, filtro novo). */
export function CatalogEmptyState({
  search,
  total,
  onSearchChange,
  className,
}: CatalogEmptyStateProps) {
  if (total > 0) {
    return (
      <StateMessage
        icon={FileQuestion}
        title="Esta página não existe"
        description="A busca tem menos páginas do que o endereço pede."
        className={className}
        action={
          <Button variant="secondary" size="sm" onClick={() => onSearchChange({ page: 1 })}>
            Ir para a primeira página
          </Button>
        }
      />
    )
  }

  const filtered = hasActiveFilters(search)
  return (
    <StateMessage
      icon={SearchX}
      title={
        search.q === undefined
          ? 'Nenhum filme encontrado'
          : `Nenhum filme encontrado para ‘${search.q}’`
      }
      description={
        filtered
          ? 'Confira a grafia, tente o nome de um diretor ou remova alguns filtros.'
          : 'O catálogo ainda não tem filmes.'
      }
      className={className}
      action={
        filtered && (
          <Button variant="secondary" size="sm" onClick={() => onSearchChange(clearedMovieSearch)}>
            Limpar filtros
          </Button>
        )
      }
    />
  )
}
