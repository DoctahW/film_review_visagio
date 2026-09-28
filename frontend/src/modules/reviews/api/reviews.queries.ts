import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import { listRecentReviews, listReviews } from '@/lib/api'

export const REVIEWS_PAGE_SIZE = 10

export const reviewKeys = {
  all: ['reviews'] as const,
  forMovie: (movieId: string) => [...reviewKeys.all, movieId] as const,
  page: (movieId: string, page: number) => [...reviewKeys.forMovie(movieId), { page }] as const,
  // "recent" nunca colide com `forMovie`: ids de filme são hashes de 64 caracteres.
  recent: () => [...reviewKeys.all, 'recent'] as const,
  recentPage: (pageSize: number) => [...reviewKeys.recent(), { pageSize }] as const,
}

/** Histórico de avaliações do filme, mais recentes primeiro. */
export function movieReviewsQueryOptions(movieId: string, page: number) {
  return queryOptions({
    queryKey: reviewKeys.page(movieId, page),
    queryFn: async ({ signal }) =>
      (
        await listReviews({
          path: { sk_movie_id: movieId },
          query: { page, page_size: REVIEWS_PAGE_SIZE },
          signal,
        })
      ).data,
    placeholderData: keepPreviousData,
  })
}

/** Avaliações mais recentes de todos os filmes, cada uma com o resumo do filme. */
export function recentReviewsQueryOptions(pageSize: number) {
  return queryOptions({
    queryKey: reviewKeys.recentPage(pageSize),
    queryFn: async ({ signal }) =>
      (await listRecentReviews({ query: { page: 1, page_size: pageSize }, signal })).data,
    // Sempre revalida ao montar: excluir um filme (módulo `movies`, que não conhece esta chave)
    // também remove as avaliações dele do feed.
    staleTime: 0,
  })
}
