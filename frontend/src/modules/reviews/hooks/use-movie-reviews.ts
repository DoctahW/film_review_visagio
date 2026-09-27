import { useQuery } from '@tanstack/react-query'

import { movieReviewsQueryOptions } from '../api/reviews.queries'

export function useMovieReviews(movieId: string, page: number) {
  return useQuery(movieReviewsQueryOptions(movieId, page))
}
