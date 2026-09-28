import type { QueryClient } from '@tanstack/react-query'
import { notFound } from '@tanstack/react-router'

import { isApiError } from '@/lib/api'

import { movieDetailQueryOptions } from './movies.queries'

/**
 * Loader das rotas de filme (pública e admin): garante o detalhe no cache antes de renderizar
 * (`useMovie` nunca vê `undefined`) e converte o 404 da API em `notFound` do router.
 */
export async function ensureMovie(queryClient: QueryClient, movieId: string) {
  try {
    return await queryClient.ensureQueryData(movieDetailQueryOptions(movieId))
  } catch (error) {
    if (isApiError(error) && error.status === 404) throw notFound()
    throw error
  }
}
