import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { PosterImage } from '@/components/poster-image'
import { Badge } from '@/components/ui/badge'
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/menu'
import { Skeleton } from '@/components/ui/skeleton'
import { CompactRating } from '@/components/ui/star-rating'
import type { MovieListItem } from '@/lib/api'
import { cn } from '@/lib/utils'

import { DeleteMovieDialog } from './delete-movie-dialog'

// Mobile: pôster, texto e menu. Desktop: pôster, filme, ano, gêneros, média e menu.
const rowGrid =
  'grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-x-3 md:grid-cols-[2.5rem_minmax(0,1fr)_4rem_13rem_8rem_2.75rem] md:gap-x-4'

const MAX_GENRES = 2

type MovieRef = Pick<MovieListItem, 'sk_movie_id' | 'titulo'>

type AdminMovieListProps = {
  movies: MovieListItem[]
  /** Resultados da página anterior enquanto a nova carrega: esmaece em vez de piscar. */
  stale?: boolean
  className?: string
}

/** Lista de gestão densa: tabela no desktop, linhas compactas no mobile; ações no menu de cada linha. */
export function AdminMovieList({ movies, stale = false, className }: AdminMovieListProps) {
  // `target` sobrevive ao fechamento para o título não sumir durante a animação de saída.
  const [target, setTarget] = useState<MovieRef | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <div className={className}>
      <ListHeader />
      <ul
        aria-busy={stale}
        className={cn(
          'flex flex-col gap-2 transition-opacity duration-200 md:gap-0',
          stale && 'pointer-events-none opacity-50',
        )}
      >
        {movies.map((movie) => (
          <AdminMovieRow
            key={movie.sk_movie_id}
            movie={movie}
            onDelete={() => {
              setTarget({ sk_movie_id: movie.sk_movie_id, titulo: movie.titulo })
              setDeleteOpen(true)
            }}
          />
        ))}
      </ul>
      {target && (
        <DeleteMovieDialog movie={target} open={deleteOpen} onOpenChange={setDeleteOpen} />
      )}
    </div>
  )
}

/** Rótulos das colunas: só visuais, cada célula já é legível pelo conteúdo da linha. */
function ListHeader() {
  return (
    <div
      aria-hidden
      className={cn(
        rowGrid,
        'hidden border-b border-border px-3 pb-3 text-xs font-medium text-subtle-foreground md:grid',
      )}
    >
      <span className="col-span-2">Filme</span>
      <span>Ano</span>
      <span>Gêneros</span>
      <span>Média</span>
    </div>
  )
}

type AdminMovieRowProps = {
  movie: MovieListItem
  onDelete: () => void
}

function AdminMovieRow({ movie, onDelete }: AdminMovieRowProps) {
  const navigate = useNavigate()
  const params = { movieId: movie.sk_movie_id }
  const directors = movie.diretores.join(', ')
  const mobileMeta = [movie.ano_lancamento, movie.generos.slice(0, MAX_GENRES).join(', ')]
    .filter(Boolean)
    .join(' · ')

  return (
    <li
      className={cn(
        rowGrid,
        'rounded-2xl bg-surface p-3 transition-colors',
        'md:rounded-none md:border-b md:border-border/60 md:bg-transparent md:py-2.5 md:hover:bg-surface',
      )}
    >
      <PosterImage
        src={movie.url_poster}
        title={movie.titulo}
        width="w185"
        // Miniatura pequena demais para a legenda do fallback: fica só o ícone.
        className="aspect-2/3 w-full rounded-lg [&_span]:hidden [&_svg]:size-4"
      />

      <div className="flex min-w-0 flex-col gap-0.5">
        <Link
          to="/admin/filmes/$movieId"
          params={params}
          className="truncate rounded-sm font-semibold text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
        >
          {movie.titulo}
        </Link>
        <p className="truncate text-sm text-muted-foreground">
          {directors || <span className="text-subtle-foreground">Direção não informada</span>}
        </p>
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground md:hidden">
          {mobileMeta && <span className="truncate">{mobileMeta}</span>}
          <RatingSummary movie={movie} />
        </div>
      </div>

      <span className="hidden text-sm text-muted-foreground tabular-nums md:block">
        {movie.ano_lancamento ?? '—'}
      </span>

      <GenreBadges genres={movie.generos} />

      <div className="hidden md:block">
        <RatingSummary movie={movie} />
      </div>

      <Menu>
        <MenuTrigger aria-label={`Ações de ${movie.titulo}`} className="justify-self-end">
          <MoreHorizontal aria-hidden className="size-5" />
        </MenuTrigger>
        <MenuContent>
          <MenuItem onClick={() => navigate({ to: '/admin/filmes/$movieId', params })}>
            <Eye aria-hidden />
            Ver detalhes
          </MenuItem>
          <MenuItem onClick={() => navigate({ to: '/admin/filmes/$movieId/editar', params })}>
            <Pencil aria-hidden />
            Editar
          </MenuItem>
          <MenuSeparator />
          <MenuItem tone="danger" onClick={onDelete}>
            <Trash2 aria-hidden />
            Excluir
          </MenuItem>
        </MenuContent>
      </Menu>
    </li>
  )
}

function GenreBadges({ genres }: { genres: string[] }) {
  if (genres.length === 0) {
    return <span className="hidden text-sm text-subtle-foreground md:block">—</span>
  }
  const hidden = genres.length - MAX_GENRES

  return (
    <div className="hidden min-w-0 items-center gap-1.5 md:flex">
      {genres.slice(0, MAX_GENRES).map((genre) => (
        <Badge key={genre} className="min-w-0">
          <span className="truncate">{genre}</span>
        </Badge>
      ))}
      {hidden > 0 && (
        <Badge variant="outline" title={genres.slice(MAX_GENRES).join(', ')}>
          +{hidden}
        </Badge>
      )}
    </div>
  )
}

function RatingSummary({ movie }: { movie: MovieListItem }) {
  const { media_nota: average, qtd_avaliacoes: count } = movie.avaliacao
  return (
    <CompactRating
      value={average}
      count={count}
      variant="short"
      className={cn('shrink-0', average === null ? 'text-xs' : 'text-sm')}
    />
  )
}

/** Linhas cinzas com a forma da lista, para a primeira carga. */
export function AdminMovieListSkeleton({
  count,
  className,
}: {
  count: number
  className?: string
}) {
  return (
    <div role="status" className={className}>
      <span className="sr-only">Carregando filmes…</span>
      <div aria-hidden>
        <ListHeader />
        <div className="flex flex-col gap-2 md:gap-0">
          {Array.from({ length: count }, (_, index) => (
            <div
              key={index}
              className={cn(
                rowGrid,
                'rounded-2xl bg-surface p-3 md:rounded-none md:border-b md:border-border/60 md:bg-transparent md:py-2.5',
              )}
            >
              <Skeleton className="aspect-2/3 w-full rounded-lg" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-3/5 rounded-full" />
                <Skeleton className="h-3.5 w-2/5 rounded-full" />
              </div>
              <Skeleton className="hidden h-3.5 w-10 rounded-full md:block" />
              <div className="hidden gap-1.5 md:flex">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
              <Skeleton className="hidden h-3.5 w-16 rounded-full md:block" />
              <Skeleton className="size-9 justify-self-end rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
