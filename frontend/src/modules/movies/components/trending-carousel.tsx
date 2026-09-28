import { Link } from '@tanstack/react-router'
import { ArrowRight, ChevronLeft, ChevronRight, Clapperboard } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, type KeyboardEvent } from 'react'

import { pageContainer } from '@/components/layout/app-shell'
import { PosterImage } from '@/components/poster-image'
import { ErrorState, StateMessage } from '@/components/state-message'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CompactRating } from '@/components/ui/star-rating'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/use-media-query'
import { loadPosterAccent, usePosterAccent } from '@/hooks/use-poster-accent'
import type { MovieListItem } from '@/lib/api'
import { accentStyle } from '@/lib/color'
import { cn } from '@/lib/utils'

import type { MovieListParams } from '../api/movies.queries'
import { useMovies } from '../hooks/use-movies'
import { useLoopCarousel, wrapDelta, type SlideLayout } from './trending-loop'

type TrendingCarouselProps = {
  params: MovieListParams
  title: string
}

/**
 * Filmes em alta. Desktop: roda de pôsteres com o ativo sempre no centro e vizinhos dos dois
 * lados. Celular: o pôster ocupa a tela inteira e, ao rolar a página, "desgruda" e vira um card.
 */
export function TrendingCarousel({ params, title }: TrendingCarouselProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const { data, isPending, isError, error, refetch } = useMovies(params)

  if (isPending)
    return isDesktop ? <DesktopSkeleton title={title} /> : <MobileSkeleton title={title} />
  if (isError || data.items.length === 0) {
    return (
      <div className={cn(pageContainer, 'flex flex-col gap-6 pt-6 md:pt-10')}>
        <TrendingHeading title={title} />
        {isError ? (
          <ErrorState
            title="Não foi possível carregar os filmes em alta"
            error={error}
            onRetry={() => void refetch()}
          />
        ) : (
          <StateMessage icon={Clapperboard} title="Nenhum filme em alta agora" />
        )}
      </div>
    )
  }
  return isDesktop ? (
    <DesktopTrending movies={data.items} title={title} />
  ) : (
    <MobileTrending movies={data.items} title={title} />
  )
}

function TrendingHeading({ title }: { title: string }) {
  return <h1 className="text-3xl font-bold tracking-tight md:text-5xl">{title}</h1>
}

/** Acento do tema tirado do pôster ativo; os demais são pré-carregados para a troca ser imediata. */
function useActiveAccent(movies: MovieListItem[], active: number) {
  useEffect(() => {
    for (const movie of movies) if (movie.url_poster) void loadPosterAccent(movie.url_poster)
  }, [movies])
  return accentStyle(usePosterAccent(movies[active]?.url_poster ?? null))
}

function carouselKeyHandler(
  count: number,
  goTo: (index: number) => void,
  step: (d: 1 | -1) => void,
) {
  return (event: KeyboardEvent<HTMLElement>) => {
    const actions: Record<string, () => void> = {
      ArrowLeft: () => step(-1),
      ArrowRight: () => step(1),
      Home: () => goTo(0),
      End: () => goTo(count - 1),
    }
    const action = actions[event.key]
    if (!action) return
    event.preventDefault()
    action()
  }
}

/* ------------------------------------------------------------------ desktop */

/**
 * Largura do pôster central; os vizinhos são o mesmo slot encolhido por `transform`.
 * A partir de `lg` acompanha a tela (20vw: 384px em 1080p, 512px em 1440p), limitada pela altura
 * da janela para título e botão continuarem visíveis sem rolar, e com teto de 34rem.
 */
const desktopSlideWidth =
  '[--slide-w:18.5rem] lg:[--slide-w:clamp(20.5rem,min(20vw,calc((100svh-22rem)/1.5)),34rem)]'

const MIN_SCALE = 0.66
const SCALE_STEP = 0.17
/** Respiro visual entre pôsteres depois de encolhidos. */
const VISUAL_GAP = 16

function scaleAt(distance: number) {
  return Math.max(MIN_SCALE, 1 - SCALE_STEP * distance)
}

/** Centro do slide `n` (inteiro) em relação ao central, já descontando os encolhimentos. */
function packedOffset(n: number, width: number) {
  let offset = 0
  for (let k = 1; k <= n; k++) offset += ((scaleAt(k - 1) + scaleAt(k)) * width) / 2 + VISUAL_GAP
  return offset
}

/** Vizinhos encolhem e esmaecem com a distância; a 1 e 2 posições ficam visíveis, depois somem. */
const desktopLayout: SlideLayout = (delta, width) => {
  const distance = Math.abs(delta)
  const lower = Math.floor(distance)
  const from = packedOffset(lower, width)
  const packed = from + (packedOffset(lower + 1, width) - from) * (distance - lower)
  return {
    x: Math.sign(delta) * packed,
    scale: scaleAt(distance),
    opacity: distance <= 2 ? 1 - 0.35 * distance : Math.max(0, 0.3 * (3 - distance)),
  }
}

function DesktopTrending({ movies, title }: { movies: MovieListItem[]; title: string }) {
  const { active, goTo, step, trackProps, slideRef } = useLoopCarousel(movies.length, desktopLayout)
  const onKeyDown = carouselKeyHandler(movies.length, goTo, step)
  const activeMovie = movies[active]
  const accent = useActiveAccent(movies, active)

  return (
    <section
      role="region"
      aria-roledescription="carrossel"
      aria-label={title}
      onKeyDown={onKeyDown}
      style={accent}
      className={cn('relative flex flex-col items-center', desktopSlideWidth)}
    >
      <div className={cn(pageContainer, 'pt-10')}>
        <TrendingHeading title={title} />
      </div>

      <div className="relative mt-8 w-full">
        <div
          {...trackProps}
          tabIndex={0}
          className="group/rail relative h-[calc(var(--slide-w)*1.5)] cursor-grab touch-pan-y outline-none select-none data-dragging:cursor-grabbing"
        >
          {movies.map((movie, index) => (
            <div
              key={movie.sk_movie_id}
              ref={slideRef(index)}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} de ${movies.length}: ${movie.titulo}`}
              className="absolute top-0 left-[calc(50%-var(--slide-w)/2)] w-(--slide-w) origin-center will-change-transform"
            >
              <Link
                to="/filmes/$movieId"
                params={{ movieId: movie.sk_movie_id }}
                tabIndex={-1}
                draggable={false}
                onClick={(event) => {
                  // Clicar num vizinho traz ele para o centro; no central, abre o detalhe.
                  if (index === active) return
                  event.preventDefault()
                  goTo(index)
                }}
                className={cn(
                  'block rounded-card',
                  // Foco do teclado fica no trilho; o anel aparece no pôster central.
                  index === active &&
                    'group-focus-visible/rail:ring-2 group-focus-visible/rail:ring-ring group-focus-visible/rail:ring-offset-4 group-focus-visible/rail:ring-offset-background',
                )}
              >
                <PosterImage
                  src={movie.url_poster}
                  title={movie.titulo}
                  priority={Math.abs(wrapDelta(index - active, movies.length)) <= 2}
                  className="pointer-events-none aspect-2/3 w-full rounded-card shadow-poster"
                />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Setas ao lado dos pontinhos, logo abaixo do pôster: perto do olho em qualquer resolução. */}
      <div className="mt-5 flex items-center gap-4">
        <Button
          size="icon-sm"
          aria-label="Filme anterior"
          onClick={() => step(-1)}
          className="transition-[background-color,color,scale] active:scale-95"
        >
          <ChevronLeft aria-hidden className="size-5" />
        </Button>
        <Dots count={movies.length} active={active} />
        <Button
          size="icon-sm"
          aria-label="Próximo filme"
          onClick={() => step(1)}
          className="transition-[background-color,color,scale] active:scale-95"
        >
          <ChevronRight aria-hidden className="size-5" />
        </Button>
      </div>
      {activeMovie && <ActiveMovieInfo movie={activeMovie} />}
    </section>
  )
}

function ActiveMovieInfo({ movie }: { movie: MovieListItem }) {
  return (
    <div aria-live="polite" className="mt-6 w-full px-4">
      {/* `key` remonta o bloco a cada troca; `starting:` anima a entrada. */}
      <div
        key={movie.sk_movie_id}
        className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center transition duration-500 ease-out motion-reduce:transition-none starting:translate-y-2 starting:opacity-0"
      >
        <p className="line-clamp-2 text-4xl font-bold tracking-tight text-balance">
          {movie.titulo}
        </p>
        <MovieMeta movie={movie} className="flex-row gap-2" />
        <DetailsLink movie={movie} className="mt-2" />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- mobile */

const MOBILE_GAP = 16
/** Pôsteres lado a lado, sem encolher: o gesto troca o card inteiro, como páginas. */
const mobileLayout: SlideLayout = (delta, width) => ({
  x: delta * (width + MOBILE_GAP),
  scale: 1,
  opacity: Math.abs(delta) < 1.5 ? 1 : 0,
})

/**
 * Pôster em tela cheia (sem o cabeçalho do site). A seção é mais alta que a tela e o palco fica
 * `sticky`: rolando para baixo, `--p` vai de 0 a 1 e o pôster encolhe, arredonda os cantos e
 * ganha sombra, como se descolasse da tela; depois a página segue para os trilhos.
 */
function MobileTrending({ movies, title }: { movies: MovieListItem[]; title: string }) {
  const { active, goTo, step, trackProps, slideRef } = useLoopCarousel(movies.length, mobileLayout)
  const onKeyDown = carouselKeyHandler(movies.length, goTo, step)
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const accent = useActiveAccent(movies, active)

  useLayoutEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    if (!section || !stage) return
    let frame = 0
    const update = () => {
      frame = 0
      const travel = section.offsetHeight - stage.offsetHeight || 1
      const progress = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / travel))
      stage.style.setProperty('--p', progress.toFixed(4))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  const activeMovie = movies[active]

  return (
    <section
      ref={sectionRef}
      role="region"
      aria-roledescription="carrossel"
      aria-label={title}
      onKeyDown={onKeyDown}
      style={accent}
      className="relative h-[calc(145svh-4rem)]"
    >
      <div
        ref={stageRef}
        className="sticky top-0 isolate h-[calc(100svh-4rem)] overflow-hidden [--p:0]"
      >
        {/* Encolhe a partir da base: o topo desce e abre espaço para o título. */}
        <div className="absolute inset-0 origin-bottom [transform:translateY(calc(var(--p)*-1rem))_scale(calc(1-var(--p)*0.14))] will-change-transform">
          <div
            {...trackProps}
            tabIndex={0}
            className="relative size-full touch-pan-y outline-none select-none"
          >
            {movies.map((movie, index) => (
              <div
                key={movie.sk_movie_id}
                ref={slideRef(index)}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} de ${movies.length}: ${movie.titulo}`}
                inert={index !== active}
                className="absolute inset-0 will-change-transform"
              >
                <div className="relative size-full overflow-hidden rounded-[calc(var(--p)*2.25rem)] shadow-[0_40px_80px_-24px_rgb(0_0_0/calc(var(--p)*0.9))]">
                  <PosterImage
                    src={movie.url_poster}
                    title={movie.titulo}
                    width="w780"
                    priority={Math.abs(wrapDelta(index - active, movies.length)) <= 1}
                    className="pointer-events-none absolute inset-0"
                  />
                  {/* Véus fortes em cima e embaixo: textos legíveis em qualquer pôster, até os claros. */}
                  <div
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-52 bg-linear-to-b from-black/85 via-black/45 to-transparent"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-[linear-gradient(to_top,#000_0%,#000_32%,rgb(0_0_0/0.78)_62%,transparent_100%)] px-5 pt-52 pb-7 text-center">
                    <p className="line-clamp-2 text-3xl font-bold tracking-tight text-balance text-white">
                      {movie.titulo}
                    </p>
                    <MovieMeta movie={movie} className="gap-1.5 text-white/80" />
                    <DetailsLink movie={movie} className="mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-110 flex items-center justify-between gap-4 px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)]">
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">{title}</h1>
          <Dots count={movies.length} active={active} />
        </div>
        {activeMovie && (
          <p aria-live="polite" className="sr-only">
            {activeMovie.titulo}, {active + 1} de {movies.length}
          </p>
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------- shared */

function MovieMeta({ movie, className }: { movie: MovieListItem; className?: string }) {
  const meta = [movie.ano_lancamento, movie.generos.slice(0, 2).join(', ')]
    .filter(Boolean)
    .join(' · ')
  return (
    <div className={cn('flex flex-col items-center text-sm text-muted-foreground', className)}>
      {meta && <span>{meta}</span>}
      {meta && (
        <span aria-hidden className="hidden md:inline">
          ·
        </span>
      )}
      <CompactRating value={movie.avaliacao.media_nota} count={movie.avaliacao.qtd_avaliacoes} />
    </div>
  )
}

function DetailsLink({ movie, className }: { movie: MovieListItem; className?: string }) {
  return (
    <Link
      to="/filmes/$movieId"
      params={{ movieId: movie.sk_movie_id }}
      className={cn(buttonVariants({ size: 'lg' }), className)}
    >
      Ver detalhes
      <ArrowRight aria-hidden />
    </Link>
  )
}

function Dots({ count, active, className }: { count: number; active: number; className?: string }) {
  return (
    <div aria-hidden className={cn('flex items-center gap-1.5', className)}>
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none',
            index === active ? 'w-6 bg-primary' : 'w-1.5 bg-foreground/30',
          )}
        />
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- skeletons */

function DesktopSkeleton({ title }: { title: string }) {
  const sides = [
    { width: 'w-[calc(var(--slide-w)*0.66)]', opacity: 'opacity-30' },
    { width: 'w-[calc(var(--slide-w)*0.83)]', opacity: 'opacity-60' },
  ]
  return (
    <div
      aria-busy
      aria-label="Carregando filmes em alta"
      className={cn('flex flex-col items-center overflow-hidden', desktopSlideWidth)}
    >
      <div className={cn(pageContainer, 'pt-10')}>
        <h1 className="text-5xl font-bold tracking-tight">{title}</h1>
      </div>
      <div className="mt-8 flex items-center justify-center gap-4">
        {sides.map((side) => (
          <Skeleton
            key={side.width}
            className={cn('aspect-2/3 shrink-0 rounded-card', side.width, side.opacity)}
          />
        ))}
        <Skeleton className="aspect-2/3 w-(--slide-w) shrink-0 rounded-card" />
        {[...sides].reverse().map((side) => (
          <Skeleton
            key={side.width}
            className={cn('aspect-2/3 shrink-0 rounded-card', side.width, side.opacity)}
          />
        ))}
      </div>
      <Skeleton className="mt-6 h-1.5 w-24 rounded-full" />
      <div className="mt-6 flex w-full flex-col items-center gap-3 px-4">
        <Skeleton className="h-10 w-3/4 max-w-md rounded-full" />
        <Skeleton className="h-4 w-2/3 max-w-sm rounded-full" />
        <Skeleton className="mt-2 h-12 w-44 rounded-full" />
      </div>
    </div>
  )
}

function MobileSkeleton({ title }: { title: string }) {
  return (
    <div
      aria-busy
      aria-label="Carregando filmes em alta"
      className="relative h-[calc(100svh-4rem)]"
    >
      <Skeleton className="absolute inset-0 rounded-none" />
      <h1 className="absolute top-0 left-0 px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] text-3xl font-bold tracking-tight">
        {title}
      </h1>
      <div className="absolute inset-x-0 bottom-7 flex flex-col items-center gap-3 px-5">
        <Skeleton className="h-8 w-3/4 rounded-full bg-border" />
        <Skeleton className="h-4 w-1/2 rounded-full bg-border" />
        <Skeleton className="mt-1 h-12 w-44 rounded-full bg-border" />
      </div>
    </div>
  )
}
