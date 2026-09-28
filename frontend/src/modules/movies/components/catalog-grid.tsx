import type { MovieListItem } from '@/lib/api'
import { cn } from '@/lib/utils'

import { MovieCard, MovieCardSkeleton } from './movie-card'

const gridClasses =
  'grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 md:gap-x-5 xl:grid-cols-6'

// Primeira linha da grade no desktop largo: pôsteres acima da dobra carregam sem `lazy`.
const PRIORITY_COUNT = 6

type CatalogGridProps = {
  movies: MovieListItem[]
  /** Resultados da página anterior enquanto a nova carrega: esmaece em vez de piscar. */
  stale?: boolean
  className?: string
}

/** Grade responsiva de `MovieCard` do catálogo público (2 → 3 → 4 → 6 colunas). */
export function CatalogGrid({ movies, stale = false, className }: CatalogGridProps) {
  return (
    <ul
      aria-busy={stale}
      className={cn(
        gridClasses,
        'transition-opacity duration-200',
        stale && 'pointer-events-none opacity-50',
        className,
      )}
    >
      {movies.map((movie, index) => (
        <li key={movie.sk_movie_id}>
          <MovieCard movie={movie} priority={index < PRIORITY_COUNT} />
        </li>
      ))}
    </ul>
  )
}

export function CatalogGridSkeleton({ count, className }: { count: number; className?: string }) {
  return (
    <div role="status" className={className}>
      <span className="sr-only">Carregando filmes…</span>
      <div aria-hidden className={gridClasses}>
        {Array.from({ length: count }, (_, index) => (
          <MovieCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}
