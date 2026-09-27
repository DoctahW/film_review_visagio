import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import { getMovie, listMovies, type ListMoviesData } from '@/lib/api'

export type MovieListParams = NonNullable<ListMoviesData['query']>

export const movieKeys = {
  all: ['movies'] as const,
  lists: () => [...movieKeys.all, 'list'] as const,
  list: (params: MovieListParams) => [...movieKeys.lists(), params] as const,
  details: () => [...movieKeys.all, 'detail'] as const,
  detail: (movieId: string) => [...movieKeys.details(), movieId] as const,
}

export function movieListQueryOptions(params: MovieListParams) {
  return queryOptions({
    queryKey: movieKeys.list(params),
    queryFn: async ({ signal }) => (await listMovies({ query: params, signal })).data,
    // Mantém a página anterior na tela enquanto a próxima carrega.
    placeholderData: keepPreviousData,
  })
}

export function movieDetailQueryOptions(movieId: string) {
  return queryOptions({
    queryKey: movieKeys.detail(movieId),
    queryFn: async ({ signal }) =>
      (await getMovie({ path: { sk_movie_id: movieId }, signal })).data,
  })
}
