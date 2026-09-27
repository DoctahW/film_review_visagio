import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import { listReviews } from '@/lib/api'

export const REVIEWS_PAGE_SIZE = 10

export const reviewKeys = {
  all: ['reviews'] as const,
  forMovie: (movieId: string) => [...reviewKeys.all, movieId] as const,
  page: (movieId: string, page: number) => [...reviewKeys.forMovie(movieId), { page }] as const,
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
