import { Skeleton } from '@/components/ui/skeleton'
import type { PageMovieListItem } from '@/lib/api'
import { formatInteger } from '@/lib/format'
import { cn } from '@/lib/utils'

type CatalogSummaryProps = {
  /** Página atual da listagem; ausente enquanto a primeira carga não chega. */
  data: Pick<PageMovieListItem, 'page' | 'page_size' | 'total'> | undefined
  className?: string
}

/** "25–48 de 95.645 filmes": intervalo exibido e total da busca. */
export function CatalogSummary({ data, className }: CatalogSummaryProps) {
  if (!data) return <Skeleton className={cn('h-5 w-44 rounded-full', className)} />

  const { page, page_size: pageSize, total } = data
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const noun = total === 1 ? 'filme' : 'filmes'

  return (
    <p aria-live="polite" className={cn('text-sm text-muted-foreground tabular-nums', className)}>
      {total === 0 ? (
        'Nenhum filme'
      ) : from > total ? (
        `${formatInteger(total)} ${noun}`
      ) : (
        <>
          <span className="font-semibold text-foreground">
            {formatInteger(from)}–{formatInteger(to)}
          </span>{' '}
          de {formatInteger(total)} {noun}
        </>
      )}
    </p>
  )
}
