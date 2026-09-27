import { createFileRoute, notFound } from '@tanstack/react-router'

import { isApiError } from '@/lib/api'
import { movieDetailQueryOptions } from '@/modules/movies'

// Layout de /filmes/:movieId e /filmes/:movieId/editar: garante o filme no cache antes dos filhos
// renderizarem (`useMovie` nunca vê `undefined`) e converte 404 da API em `notFound`.
export const Route = createFileRoute('/filmes/$movieId')({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(movieDetailQueryOptions(params.movieId))
    } catch (error) {
      if (isApiError(error) && error.status === 404) throw notFound()
      throw error
    }
  },
})
