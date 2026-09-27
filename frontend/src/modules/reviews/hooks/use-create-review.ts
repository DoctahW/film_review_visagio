import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createReview, type ReviewCreate } from '@/lib/api'
import { movieKeys } from '@/modules/movies'

import { reviewKeys } from '../api/reviews.queries'

export function useCreateReview(movieId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: ReviewCreate) =>
      (await createReview({ path: { sk_movie_id: movieId }, body })).data,
    // A média muda no detalhe e na listagem, além do histórico.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: reviewKeys.forMovie(movieId) }),
        queryClient.invalidateQueries({ queryKey: movieKeys.detail(movieId) }),
        queryClient.invalidateQueries({ queryKey: movieKeys.lists() }),
      ]),
  })
}
