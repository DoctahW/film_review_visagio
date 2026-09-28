import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'

import { pageContainer } from '@/components/layout/app-shell'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  MovieRail,
  TrendingCarousel,
  movieListQueryOptions,
  type MovieListParams,
} from '@/modules/movies'
import { RecentReviews, recentReviewsQueryOptions } from '@/modules/reviews'

const trendingParams = {
  sort: 'popularidade',
  order: 'desc',
  page: 1,
  page_size: 10,
} satisfies MovieListParams

// Já lançados e com público (100+ votos no TMDB), do mais novo para o mais antigo: sem o filtro
// de votos o topo seria de títulos obscuros ou anunciados para daqui a anos.
const newReleasesParams = {
  sort: 'lancamento',
  order: 'desc',
  lancados: true,
  min_votos: 100,
  page: 1,
  page_size: 14,
} satisfies MovieListParams

const RECENT_REVIEWS = 6

const genreRails = [
  { title: 'Animações em alta', genero: 'Animation' },
  { title: 'Terror em alta', genero: 'Horror' },
].map((rail) => ({
  ...rail,
  params: {
    genero: rail.genero,
    sort: 'popularidade',
    order: 'desc',
    page: 1,
    page_size: 14,
  } satisfies MovieListParams,
}))

export const Route = createFileRoute('/_site/')({
  // Sem `await`: a página abre com skeletons e cada bloco aparece quando o seu dado chega.
  loader: ({ context: { queryClient } }) => {
    for (const params of [trendingParams, newReleasesParams, ...genreRails.map((r) => r.params)]) {
      void queryClient.prefetchQuery(movieListQueryOptions(params))
    }
    void queryClient.prefetchQuery(recentReviewsQueryOptions(RECENT_REVIEWS))
  },
  component: HomePage,
})

function HomePage() {
  return (
    <div className="relative isolate overflow-x-clip">
      <TrendingCarousel params={trendingParams} title="Em alta" />

      <div className={cn(pageContainer, 'mt-14 flex flex-col gap-12 md:mt-20 md:gap-16')}>
        <MovieRail title="Novos lançamentos" params={newReleasesParams} />
        <RecentReviews title="Últimas avaliações" count={RECENT_REVIEWS} />
        {genreRails.map((rail) => (
          <MovieRail
            key={rail.genero}
            title={rail.title}
            params={rail.params}
            action={
              <Link
                to="/filmes"
                search={{ genero: rail.genero }}
                className={cn(buttonVariants({ variant: 'ghost' }), 'px-3')}
              >
                Ver todos
                <ChevronRight aria-hidden />
              </Link>
            }
          />
        ))}
      </div>
    </div>
  )
}
