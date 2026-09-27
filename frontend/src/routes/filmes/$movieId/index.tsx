import { createFileRoute } from '@tanstack/react-router'

import { useMovie } from '@/modules/movies'
import { movieReviewsQueryOptions } from '@/modules/reviews'

export const Route = createFileRoute('/filmes/$movieId/')({
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(movieReviewsQueryOptions(params.movieId, 1))
  },
  component: MovieDetailPage,
})

// Casca provisória: a página de detalhe (F3/F4) entra na fase de UI.
function MovieDetailPage() {
  const { movieId } = Route.useParams()
  const { data: movie } = useMovie(movieId)
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">{movie.titulo}</h1>
    </main>
  )
}
