import { movieSearchDefaults, type MovieSearch } from '../schemas/movie-search.schema'

/** Tudo o que "Limpar filtros" zera: busca, gênero, ano, ordenação e página. */
export const clearedMovieSearch = {
  q: undefined,
  genero: undefined,
  ano: undefined,
  ...movieSearchDefaults,
} satisfies Partial<MovieSearch>

/** Ordenação diferente do padrão (popularidade, maior primeiro). */
export function isCustomSort(search: MovieSearch): boolean {
  return search.sort !== movieSearchDefaults.sort || search.order !== movieSearchDefaults.order
}

/** Filtros guardados na folha do mobile (tudo menos a busca); a ordenação conta como um. */
export function countPanelFilters(search: MovieSearch): number {
  return [search.genero !== undefined, search.ano !== undefined, isCustomSort(search)].filter(
    Boolean,
  ).length
}

export function hasActiveFilters(search: MovieSearch): boolean {
  return search.q !== undefined || countPanelFilters(search) > 0
}
