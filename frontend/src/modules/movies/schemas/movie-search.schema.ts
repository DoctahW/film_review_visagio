import { z } from 'zod'

/** Mínimo de caracteres de `q` aceito pela API (S4); abaixo disso a busca é omitida. */
export const MIN_SEARCH_LENGTH = 2

export const movieSortValues = ['popularidade', 'titulo', 'ano', 'media'] as const
export const sortOrderValues = ['asc', 'desc'] as const

/**
 * Estado do catálogo na URL (`/filmes?q=&genero=&ano=&sort=&order=&page=`).
 * Valor inválido digitado na URL cai no padrão em vez de quebrar a página.
 */
export const movieSearchSchema = z.object({
  q: z.string().trim().min(MIN_SEARCH_LENGTH).optional().catch(undefined),
  genero: z.string().trim().min(1).optional().catch(undefined),
  ano: z.int().min(1888).max(2100).optional().catch(undefined),
  sort: z.enum(movieSortValues).default('popularidade').catch('popularidade'),
  order: z.enum(sortOrderValues).default('desc').catch('desc'),
  page: z.int().min(1).default(1).catch(1),
})

export type MovieSearch = z.output<typeof movieSearchSchema>

/** Valores omitidos da URL por serem o padrão. */
export const movieSearchDefaults = {
  sort: 'popularidade',
  order: 'desc',
  page: 1,
} as const satisfies Partial<MovieSearch>
