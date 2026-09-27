import { Star } from 'lucide-react'

import { formatInteger, formatRating } from '@/lib/format'
import { cn } from '@/lib/utils'

export type CompactRatingProps = {
  value: number | null
  count?: number
  variant?: 'full' | 'short'
  className?: string
}

export function CompactRating({ value, count, variant = 'full', className }: CompactRatingProps) {
  if (value === null) {
    return <span className={cn('text-subtle-foreground', className)}>Sem avaliações</span>
  }

  const countLabel =
    count === undefined
      ? null
      : `${formatInteger(count)} ${count === 1 ? 'avaliação' : 'avaliações'}`
  return (
    <span className={cn('inline-flex items-center gap-1.5 tabular-nums', className)}>
      <span className="sr-only">
        Nota {formatRating(value)} de 10{countLabel && `, ${countLabel}`}
      </span>
      <Star aria-hidden className="size-[1.1em] shrink-0 fill-current text-rating" />
      {/* A escala fica colada à nota e mais apagada: "5,3/10". */}
      <span aria-hidden className="font-semibold text-foreground">
        {formatRating(value)}
        <span className="font-normal text-subtle-foreground">/10</span>
      </span>
      {count !== undefined && (
        <span aria-hidden className="truncate text-muted-foreground">
          {variant === 'full' ? `· ${countLabel}` : `(${formatInteger(count)})`}
        </span>
      )}
    </span>
  )
}
