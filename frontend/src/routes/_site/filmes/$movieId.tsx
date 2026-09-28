import { createFileRoute } from '@tanstack/react-router'

import { NotFoundPage } from '@/components/not-found-page'
import { ensureMovie, MovieDetailView, useMovie } from '@/modules/movies'
import { movieReviewsQueryOptions, MovieReviews } from '@/modules/reviews'

// Detalhe público: somente leitura (informações + histórico de avaliações).
export const Route = createFileRoute('/_site/filmes/$movieId')({
  loader: async ({ context: { queryClient }, params: { movieId } }) => {
    // As avaliações não bloqueiam a navegação: começam a carregar junto com o filme.
    void queryClient.prefetchQuery(movieReviewsQueryOptions(movieId, 1))
    await ensureMovie(queryClient, movieId)
  },
  notFoundComponent: () => (
    <NotFoundPage
      title="Filme não encontrado"
      description="Ele pode ter sido removido do catálogo ou o endereço está incorreto."
    />
  ),
  component: MovieDetailPage,
})

function MovieDetailPage() {
  const { movieId } = Route.useParams()
  const { data: movie } = useMovie(movieId)

  return (
    <MovieDetailView movie={movie}>
      {/* Mesma coluna principal da sinopse: comentários longos não esticam até 1100px. */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
        <MovieReviews movieId={movieId} />
      </div>
    </MovieDetailView>
  )
}
