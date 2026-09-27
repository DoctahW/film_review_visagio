import { createFileRoute, stripSearchParams } from '@tanstack/react-router'

import {
  movieListQueryOptions,
  movieSearchDefaults,
  movieSearchSchema,
  useMovies,
} from '@/modules/movies'

export const Route = createFileRoute('/filmes/')({
  validateSearch: movieSearchSchema,
  search: { middlewares: [stripSearchParams(movieSearchDefaults)] },
  loaderDeps: ({ search }) => search,
  // Sem `await`: a troca de página/busca não bloqueia a navegação; a página mostra o carregamento
  // e mantém os resultados anteriores (keepPreviousData).
  loader: ({ context, deps }) => {
    void context.queryClient.prefetchQuery(movieListQueryOptions(deps))
  },
  component: CatalogPage,
})

// Casca provisória: a interface do catálogo (F1/F2) entra na fase de UI.
function CatalogPage() {
  const search = Route.useSearch()
  const { data } = useMovies(search)
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Catálogo</h1>
      {data && <p className="text-muted-foreground">{data.total} filmes</p>}
    </main>
  )
}
