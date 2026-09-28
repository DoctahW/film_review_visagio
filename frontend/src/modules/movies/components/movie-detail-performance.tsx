import type { PerformanceOut } from '@/lib/api'
import { formatCurrency, formatInteger, formatRating } from '@/lib/format'

type Stat = {
  label: string
  value: string | null
  /** Linha secundária (valor em reais, quantidade de votos). */
  detail?: string
}

/** Nota externa + votos. Sem nota, ou com zero votos (a base guarda 0 nesse caso), não há nota. */
function externalRating(label: string, nota: number | null, count: number | null): Stat {
  if (nota === null || count === 0) return { label, value: null }
  return {
    label,
    value: `${formatRating(nota)}/10`,
    detail: count === null ? undefined : count === 1 ? '1 voto' : `${formatInteger(count)} votos`,
  }
}

/** Números de bilheteria e das bases externas em cartões; campos nulos viram "Não informado". */
export function MovieDetailPerformance({ performance: p }: { performance: PerformanceOut }) {
  // O lucro é calculado mesmo sem orçamento ou receita; sem os dois, o número não significa nada.
  const hasBoxOffice = p.orcamento_usd !== null && p.receita_usd !== null

  const stats: Stat[] = [
    {
      label: 'Orçamento',
      value: p.orcamento_usd === null ? null : formatCurrency(p.orcamento_usd, 'USD'),
      detail: p.orcamento_brl === null ? undefined : formatCurrency(p.orcamento_brl, 'BRL'),
    },
    {
      label: 'Receita',
      value: p.receita_usd === null ? null : formatCurrency(p.receita_usd, 'USD'),
      detail: p.receita_brl === null ? undefined : formatCurrency(p.receita_brl, 'BRL'),
    },
    {
      label: hasBoxOffice && p.lucro_usd < 0 ? 'Prejuízo' : 'Lucro',
      value: hasBoxOffice ? formatCurrency(p.lucro_usd, 'USD') : null,
      detail: hasBoxOffice ? formatCurrency(p.lucro_brl, 'BRL') : undefined,
    },
    externalRating('Nota IMDb', p.nota_imdb, p.qtd_imdb),
    externalRating('Nota TMDB', p.nota_tmdb, p.qtd_tmdb),
    {
      label: 'Popularidade',
      value: p.popularidade === null ? null : formatInteger(Math.round(p.popularidade)),
      detail: p.popularidade === null ? undefined : 'Índice do TMDB',
    },
  ]

  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-1 rounded-card bg-surface p-4">
          <dt className="text-xs text-muted-foreground">{stat.label}</dt>
          <dd className="flex flex-col gap-0.5">
            {stat.value === null ? (
              <span className="text-base font-semibold text-subtle-foreground">Não informado</span>
            ) : (
              <span className="text-base font-bold tracking-tight tabular-nums md:text-lg">
                {stat.value}
              </span>
            )}
            {stat.detail && (
              <span className="text-xs text-subtle-foreground tabular-nums">{stat.detail}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
