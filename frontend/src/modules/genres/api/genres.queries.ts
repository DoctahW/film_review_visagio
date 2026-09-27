import { queryOptions } from '@tanstack/react-query'

import { listGenres } from '@/lib/api'

export const genreKeys = {
  all: ['genres'] as const,
}

export const genresQueryOptions = queryOptions({
  queryKey: genreKeys.all,
  queryFn: async ({ signal }) => (await listGenres({ signal })).data,
  // Só muda quando um filme cria gênero novo; as mutações de filme invalidam esta chave.
  staleTime: Infinity,
})
