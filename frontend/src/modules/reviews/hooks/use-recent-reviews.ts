import { useQuery } from '@tanstack/react-query'

import { recentReviewsQueryOptions } from '../api/reviews.queries'

export function useRecentReviews(pageSize: number) {
  return useQuery(recentReviewsQueryOptions(pageSize))
}
