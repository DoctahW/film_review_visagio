import { createFileRoute, Link, stripSearchParams } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import { pageContainer } from '@/components/layout/app-shell'
import { ErrorState } from '@/components/state-message'
import { buttonVariants } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import {
  AdminMovieList,
  AdminMovieListSkeleton,
  CatalogEmptyState,
  CatalogSummary,
  MovieFilters,
  movieListQueryOptions,
  movieSearchDefaults,
  movieSearchSchema,
  useMovies,
  type MovieSearch,
} from '@/modules/movies'

const PAGE_SIZE = 20

export const Route = createFileRoute('/admin/')({
  validateSearch: movieSearchSchema,
  search: { middlewares: [stripSearchParams(movieSearchDefaults)] },
  loaderDeps: ({ search }) => search,
  // Sem `await`: a troca de página/busca não bloqueia a navegação; a lista mantém os resultados
  // anteriores esmaecidos (keepPreviousData) até os novos chegarem.
  loader: ({ context, deps }) => {
    void context.queryClient.prefetchQuery(movieListQueryOptions({ ...deps, page_size: PAGE_SIZE }))
  },
  component: AdminMoviesPage,
})

function AdminMoviesPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data, error, isPending, isPlaceholderData, refetch } = useMovies({
    ...search,
    page_size: PAGE_SIZE,
  })

  // O router volta ao topo em toda navegação (`resetScroll`), inclusive na troca de página.
  const updateSearch = (next: Partial<MovieSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...next }) })

  return (
    <div className={cn(pageContainer, 'flex flex-col gap-6 pt-6 md:gap-8 md:pt-10')}>
      <header className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Filmes</h1>
          {(data || isPending) && <CatalogSummary data={data} />}
        </div>
        <Link to="/admin/filmes/novo" className={buttonVariants()}>
          <Plus aria-hidden className="size-5" />
          Novo filme
        </Link>
      </header>

      <MovieFilters search={search} onSearchChange={updateSearch} />

      {isPending ? (
        <AdminMovieListSkeleton count={8} />
      ) : !data ? (
        <ErrorState
          title="Não foi possível carregar os filmes"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : data.items.length === 0 ? (
        <CatalogEmptyState search={search} total={data.total} onSearchChange={updateSearch} />
      ) : (
        <>
          <AdminMovieList movies={data.items} stale={isPlaceholderData} />
          <Pagination
            page={data.page}
            pages={data.pages}
            onPageChange={(page) => updateSearch({ page })}
            className="mt-2"
          />
        </>
      )}
    </div>
  )
}
