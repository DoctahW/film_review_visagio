import { Link } from '@tanstack/react-router'

import { PosterImage } from '@/components/poster-image'
import { Skeleton } from '@/components/ui/skeleton'
import { CompactRating } from '@/components/ui/star-rating'
import type { MovieListItem } from '@/lib/api'
import { cn } from '@/lib/utils'

type MovieCardProps = {
  movie: MovieListItem
  /** Decide o destino do link: detalhe público ou detalhe da administração. */
  view?: 'site' | 'admin'
  /** Cards acima da dobra carregam o pôster sem `lazy`. */
  priority?: boolean
  className?: string
}

const cardClasses =
  'group flex flex-col gap-3 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background'

/** Pôster 2:3 + título, ano/gênero e média. O card inteiro é o link para o detalhe. */
export function MovieCard({ movie, view = 'site', priority, className }: MovieCardProps) {
  const content = <MovieCardContent movie={movie} priority={priority} />
  const params = { movieId: movie.sk_movie_id }

  return view === 'admin' ? (
    <Link to="/admin/filmes/$movieId" params={params} className={cn(cardClasses, className)}>
      {content}
    </Link>
  ) : (
    <Link to="/filmes/$movieId" params={params} className={cn(cardClasses, className)}>
      {content}
    </Link>
  )
}

function MovieCardContent({ movie, priority }: Pick<MovieCardProps, 'movie' | 'priority'>) {
  const { media_nota: average, qtd_avaliacoes: count } = movie.avaliacao
  const meta = [movie.ano_lancamento, movie.generos[0]].filter(Boolean).join(' · ')

  return (
    <>
      {/* O título já nomeia o link; o pôster fica fora da árvore de acessibilidade. */}
      <div
        aria-hidden
        className="rounded-2xl ring-1 ring-transparent transition duration-300 group-hover:-translate-y-1 group-hover:shadow-poster group-hover:ring-primary/70 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
      >
        <PosterImage
          src={movie.url_poster}
          title={movie.titulo}
          width="w342"
          priority={priority}
          className="aspect-2/3 w-full rounded-2xl"
        />
      </div>
      <div className="flex flex-col gap-1.5 px-0.5">
        <h3 className="line-clamp-2 min-h-[2lh] text-sm leading-snug font-semibold text-foreground transition-colors group-hover:text-primary">
          {movie.titulo}
        </h3>
        {meta && <p className="truncate text-xs text-muted-foreground">{meta}</p>}
        <CompactRating value={average} count={count} className="text-xs" />
      </div>
    </>
  )
}

/** Placeholder com a mesma forma do `MovieCard`. */
export function MovieCardSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('flex flex-col gap-3', className)}>
      <Skeleton className="aspect-2/3 w-full rounded-2xl" />
      <div className="flex flex-col gap-2 px-0.5">
        <Skeleton className="h-4 w-4/5 rounded-full" />
        <Skeleton className="h-3 w-1/2 rounded-full" />
        <Skeleton className="h-3 w-3/5 rounded-full" />
      </div>
    </div>
  )
}
