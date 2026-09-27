/** Larguras servidas pelo CDN do TMDB (pôsteres de w92 a w780, backdrops w300/w780/w1280). */
export type TmdbWidth = 'w92' | 'w185' | 'w342' | 'w500' | 'w780' | 'w1280'

const TMDB_SIZE = /^(https:\/\/image\.tmdb\.org\/t\/p\/)(?:w\d+|original)\//

/**
 * Troca a largura de uma imagem do TMDB (o banco guarda pôsteres em w500 e backdrops em w1280).
 * URLs de outros hosts, cadastradas pela interface, voltam intactas.
 */
export function tmdbImage(url: string, width: TmdbWidth): string {
  return url.replace(TMDB_SIZE, `$1${width}/`)
}
