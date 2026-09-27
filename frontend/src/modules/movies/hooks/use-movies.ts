import { useQuery, useSuspenseQuery } from '@tanstack/react-query'

import {
  movieDetailQueryOptions,
  movieListQueryOptions,
  type MovieListParams,
} from '../api/movies.queries'

export function useMovies(params: MovieListParams) {
  return useQuery(movieListQueryOptions(params))
}

export function useMovie(movieId: string) {
  return useSuspenseQuery(movieDetailQueryOptions(movieId))
}
