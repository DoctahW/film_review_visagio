import { useId, type ReactNode } from 'react'

import { pageContainer } from '@/components/layout/app-shell'
import { PosterImage } from '@/components/poster-image'
import { SectionHeading } from '@/components/section-heading'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/ui/star-rating'
import { usePosterAccent } from '@/hooks/use-poster-accent'
import type { MovieDetail } from '@/lib/api'
import { accentStyle } from '@/lib/color'
import { formatDate, formatDuration, formatInteger, formatRating } from '@/lib/format'
import { cn } from '@/lib/utils'

import { MovieDetailBackdrop } from './movie-detail-backdrop'
import { MovieDetailCast } from './movie-detail-cast'
import { MovieDetailPerformance } from './movie-detail-performance'

type MovieDetailViewProps = {
  movie: MovieDetail
  /** Botões ao lado da média (editar, excluir). */
  actions?: ReactNode
  /** Link de volta sobre o topo do backdrop. */
  backLink?: ReactNode
  /** Seções extras depois das informações (avaliações, formulário). */
  children?: ReactNode
}

/**
 * Página de detalhe do filme, compartilhada pela visão pública e pela administração:
 * backdrop que funde no fundo, pôster + título + média no topo e as seções de informação.
 */
export function MovieDetailView({ movie, actions, backLink, children }: MovieDetailViewProps) {
  const castHeadingId = useId()
  const { media_nota: average, qtd_avaliacoes: count } = movie.avaliacao
  const meta = [
    movie.data_lancamento && formatDate(movie.data_lancamento),
    movie.duracao_minutos !== null && formatDuration(movie.duracao_minutos),
    movie.status_filme,
  ].filter(Boolean)
  // O acento do tema (botões, foco) passa a ser a cor do pôster deste filme.
  const accent = usePosterAccent(movie.url_poster)

  return (
    <article className="relative" style={accentStyle(accent)}>
      {/* Sobe por trás do cabeçalho, que é translúcido: topo e página viram uma coisa só. */}
      <MovieDetailBackdrop
        backdrop={movie.url_backdrop}
        className="top-[calc(var(--header-h)*-1)] h-[calc(55vh+var(--header-h))] md:h-[calc(70vh+var(--header-h))]"
      />

      <div className={cn(pageContainer, 'relative')}>
        {backLink && <div className="pt-4 md:pt-6">{backLink}</div>}

        <header
          className={cn(
            'grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-6 md:grid-cols-[15rem_minmax(0,1fr)] md:grid-rows-[1fr_auto] md:gap-x-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-x-12',
            backLink ? 'pt-[20vh] md:pt-[22vh]' : 'pt-[26vh] md:pt-[30vh]',
          )}
        >
          <PosterImage
            src={movie.url_poster}
            title={movie.titulo}
            width="w342"
            priority
            className="aspect-2/3 w-full self-end rounded-2xl shadow-poster ring-1 ring-foreground/10 md:row-span-2 md:self-start md:rounded-card"
          />

          <div className="flex flex-col gap-2 self-end md:gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-balance wrap-break-word md:text-5xl">
              {movie.titulo}
              {movie.ano_lancamento !== null && (
                <span className="font-light text-muted-foreground"> ({movie.ano_lancamento})</span>
              )}
            </h1>
            {meta.length > 0 && (
              <p className="text-sm text-muted-foreground md:text-base">{meta.join(' · ')}</p>
            )}
          </div>

          <div className="col-span-2 flex flex-col gap-6 md:col-span-1 md:col-start-2">
            {movie.generos.length > 0 && (
              <ul aria-label="Gêneros" className="flex flex-wrap gap-2">
                {movie.generos.map((genre) => (
                  <li key={genre}>
                    <Badge className="h-8 px-3.5 text-sm">{genre}</Badge>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-col gap-2">
              <StarRating value={average} size="lg" showValue={false} />
              <p className="flex flex-wrap items-baseline gap-x-2 text-sm text-muted-foreground">
                {average === null ? (
                  <span>Sem avaliações ainda</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-foreground tabular-nums">
                      {formatRating(average)}
                    </span>
                    <span>/ 10</span>
                    <span aria-hidden>·</span>
                    <span className="tabular-nums">
                      {count === 1 ? '1 avaliação' : `${formatInteger(count)} avaliações`}
                    </span>
                  </>
                )}
              </p>
            </div>

            {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
          </div>
        </header>

        <div className="mt-12 flex flex-col gap-12 md:mt-16 md:gap-16">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
            <div className="flex min-w-0 flex-col gap-12">
              <section className="flex flex-col gap-4">
                <SectionHeading>Sinopse</SectionHeading>
                {movie.sinopse ? (
                  <p className="max-w-prose leading-relaxed whitespace-pre-line text-foreground/90 md:text-lg">
                    {movie.sinopse}
                  </p>
                ) : (
                  <p className="text-sm text-subtle-foreground">Sem sinopse cadastrada</p>
                )}
              </section>

              <section className="flex flex-col gap-5">
                <SectionHeading id={castHeadingId}>Elenco</SectionHeading>
                <MovieDetailCast cast={movie.elenco} labelledBy={castHeadingId} />
              </section>
            </div>

            <section className="flex flex-col gap-4">
              <SectionHeading>Ficha técnica</SectionHeading>
              <dl className="flex flex-col divide-y divide-border rounded-card bg-surface px-5 py-1">
                <Fact label="Direção" value={movie.diretores.join(', ')} />
                <Fact label="Roteiro" value={movie.roteiristas.join(', ')} />
                <Fact label="Produtoras" value={movie.produtoras.join(', ')} />
                <Fact
                  label="Lançamento"
                  value={movie.data_lancamento && formatDate(movie.data_lancamento)}
                />
                <Fact
                  label="Duração"
                  value={movie.duracao_minutos !== null && formatDuration(movie.duracao_minutos)}
                />
                <Fact label="Situação" value={movie.status_filme} />
                {/* TMDB nos filmes da base; `local-…` nos cadastrados pela interface. */}
                <Fact label="ID do filme" value={movie.id_filme} />
              </dl>
            </section>
          </div>

          {movie.desempenho && (
            <section className="flex flex-col gap-5">
              <SectionHeading>Desempenho</SectionHeading>
              <MovieDetailPerformance performance={movie.desempenho} />
            </section>
          )}

          {children}
        </div>
      </div>
    </article>
  )
}

function Fact({ label, value }: { label: string; value: string | false | null }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={value ? 'text-foreground' : 'text-subtle-foreground'}>
        {value || 'Não informado'}
      </dd>
    </div>
  )
}
