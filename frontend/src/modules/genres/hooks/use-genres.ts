import { useQuery } from '@tanstack/react-query'

import { genresQueryOptions } from '../api/genres.queries'

export function useGenres() {
  return useQuery(genresQueryOptions)
}
