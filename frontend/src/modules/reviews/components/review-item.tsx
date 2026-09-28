import { useState } from 'react'

import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StarRating } from '@/components/ui/star-rating'
import type { ReviewOut } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

// Comentários com mais caracteres (ou linhas) que isso abrem recolhidos em 4 linhas.
const LONG_COMMENT = 280

export function ReviewItem({ review }: { review: ReviewOut }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = review.comentario.length > LONG_COMMENT || review.comentario.split('\n').length > 4

  return (
    <article className="flex flex-col gap-3 rounded-card bg-surface p-5">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span aria-hidden>
          <Avatar name={review.nome} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="truncate font-semibold">{review.nome}</h3>
          <time dateTime={review.created_at} className="text-xs text-muted-foreground">
            {formatDateTime(review.created_at)}
          </time>
        </div>
        <StarRating value={review.nota} size="sm" className="basis-full sm:basis-auto" />
      </header>
      <p
        className={cn(
          'leading-relaxed whitespace-pre-line text-foreground/90',
          isLong && !expanded && 'line-clamp-4',
        )}
      >
        {review.comentario}
      </p>
      {isLong && (
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={expanded}
          className="-mx-3 -my-1 h-11 self-start px-3 text-primary"
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? 'Mostrar menos' : 'Ler mais'}
        </Button>
      )}
    </article>
  )
}

/** Placeholder com a forma de um `ReviewItem`. */
export function ReviewItemSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-4 rounded-card bg-surface p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-40 max-w-full rounded-full" />
          <Skeleton className="h-3 w-24 rounded-full" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3.5 w-full rounded-full" />
        <Skeleton className="h-3.5 w-11/12 rounded-full" />
        <Skeleton className="h-3.5 w-2/3 rounded-full" />
      </div>
    </div>
  )
}
