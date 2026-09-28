import { ChevronLeft, ChevronRight, Clapperboard } from 'lucide-react'
import { useId, useRef, type ReactNode } from 'react'

import { SectionHeading } from '@/components/section-heading'
import { ErrorState, StateMessage } from '@/components/state-message'
import { Button } from '@/components/ui/button'
import { useScrollFade } from '@/hooks/use-scroll-fade'
import { cn } from '@/lib/utils'

import type { MovieListParams } from '../api/movies.queries'
import { useMovies } from '../hooks/use-movies'
import { MovieCard, MovieCardSkeleton } from './movie-card'

type MovieRailProps = {
  title: string
  params: MovieListParams
  /** Link "Ver todos" (ex.: catálogo com os mesmos filtros). */
  action?: ReactNode
}

// Cards por vista conforme a largura do próprio trilho (container query), não da tela: ~2,3 no
// celular, 4, 5, 6 e 7 quando o container cresce em telas grandes (1440p+), com cards maiores.
const itemWidth = cn(
  'w-[43vw] max-w-44',
  '@min-[40rem]:w-[calc((100%-3*1rem)/4)] @min-[40rem]:max-w-none',
  '@min-[56rem]:w-[calc((100%-4*1rem)/5)]',
  '@min-[68rem]:w-[calc((100%-5*1rem)/6)]',
  '@min-[88rem]:w-[calc((100%-6*1rem)/7)]',
)

/** Faixa horizontal de pôsteres com rolagem por snap e setas no desktop. */
export function MovieRail({ title, params, action }: MovieRailProps) {
  const headingId = useId()
  const scrollerRef = useRef<HTMLUListElement>(null)
  const { data, isPending, isError, error, refetch } = useMovies(params)
  useScrollFade(scrollerRef, data?.items.length)

  function scrollByPage(direction: -1 | 1) {
    const scroller = scrollerRef.current
    if (!scroller) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    scroller.scrollBy({
      left: direction * scroller.clientWidth * 0.9,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }

  return (
    <section aria-labelledby={headingId} className="@container flex flex-col gap-4">
      <SectionHeading
        id={headingId}
        action={
          <div className="flex items-center gap-2">
            {action}
            {!isError && data?.items.length !== 0 && (
              <div className="hidden items-center gap-1 md:flex">
                <Button
                  variant="secondary"
                  size="icon-sm"
                  aria-label={`Anterior em ${title}`}
                  onClick={() => scrollByPage(-1)}
                >
                  <ChevronLeft aria-hidden />
                </Button>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  aria-label={`Próximos em ${title}`}
                  onClick={() => scrollByPage(1)}
                >
                  <ChevronRight aria-hidden />
                </Button>
              </div>
            )}
          </div>
        }
      >
        {title}
      </SectionHeading>

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !isPending && data.items.length === 0 ? (
        <StateMessage icon={Clapperboard} title="Nenhum filme por aqui ainda" />
      ) : (
        <ul
          ref={scrollerRef}
          aria-busy={isPending}
          className={cn(
            // Sangra até a borda da tela no celular; o respiro vertical evita cortar o hover/foco.
            '-mx-4 scrollbar-none flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain scroll-fade-x px-4 pt-2 pb-4',
            'md:-mx-8 md:scroll-px-8 md:gap-4 md:px-8',
          )}
        >
          {isPending
            ? Array.from({ length: 6 }, (_, index) => (
                <li key={index} className={cn('shrink-0 snap-start', itemWidth)}>
                  <MovieCardSkeleton />
                </li>
              ))
            : data.items.map((movie) => (
                <li key={movie.sk_movie_id} className={cn('shrink-0 snap-start', itemWidth)}>
                  <MovieCard movie={movie} />
                </li>
              ))}
        </ul>
      )}
    </section>
  )
}
