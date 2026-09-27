import { createFileRoute } from '@tanstack/react-router'

import { genresQueryOptions } from '@/modules/genres'
import { useMovie } from '@/modules/movies'

export const Route = createFileRoute('/filmes/$movieId/editar')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(genresQueryOptions)
  },
  component: MovieEditPage,
})

// Casca provisória: o formulário de edição (F5) entra na fase de UI.
function MovieEditPage() {
  const { movieId } = Route.useParams()
  const { data: movie } = useMovie(movieId)
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Editar {movie.titulo}</h1>
    </main>
  )
}
