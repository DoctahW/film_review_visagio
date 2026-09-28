import { Link } from '@tanstack/react-router'
import { MessagesSquare } from 'lucide-react'
import { useId } from 'react'

import { PosterImage } from '@/components/poster-image'
import { SectionHeading } from '@/components/section-heading'
import { ErrorState, StateMessage } from '@/components/state-message'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { CompactRating } from '@/components/ui/star-rating'
import type { RecentReviewOut } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

import { useRecentReviews } from '../hooks/use-recent-reviews'

// 1 coluna no celular, 2 em telas médias e 3 quando o container passa de 68rem.
const grid = 'grid gap-3 md:gap-4 @min-[40rem]:grid-cols-2 @min-[68rem]:grid-cols-3'

type RecentReviewsProps = {
  title: string
  count?: number
  className?: string
}

export function RecentReviews({ title, count = 6, className }: RecentReviewsProps) {
  const headingId = useId()
  const { data, isPending, isError, error, refetch } = useRecentReviews(count)

  return (
    <section
      aria-labelledby={headingId}
      className={cn('@container flex flex-col gap-4', className)}
    >
      <SectionHeading id={headingId}>{title}</SectionHeading>
      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <div aria-busy className={grid}>
          {Array.from({ length: count }, (_, index) => (
            <RecentReviewSkeleton key={index} />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <StateMessage icon={MessagesSquare} title="Ninguém avaliou um filme ainda" />
      ) : (
        <ul className={grid}>
          {data.items.map((review) => (
            <li key={review.sk_movie_review_id} className="flex">
              <RecentReviewCard review={review} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function RecentReviewCard({ review }: { review: RecentReviewOut }) {
  const { filme } = review
  return (
    // O título é o link; o `after:` estica a área clicável para o card inteiro.
    <article className="group relative flex min-w-0 flex-1 gap-4 rounded-card bg-surface p-4 transition-colors hover:bg-surface-raised has-focus-visible:ring-2 has-focus-visible:ring-ring">
      <PosterImage
        src={filme.url_poster}
        title={filme.titulo}
        width="w185"
        className="aspect-2/3 w-16 shrink-0 self-start rounded-xl md:w-20"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h3 className="truncate text-sm font-semibold">
          <Link
            to="/filmes/$movieId"
            params={{ movieId: filme.sk_movie_id }}
            className="outline-none after:absolute after:inset-0 after:rounded-card"
          >
            {filme.titulo}
          </Link>
          {filme.ano_lancamento !== null && (
            <span className="ml-1.5 font-normal text-muted-foreground">{filme.ano_lancamento}</span>
          )}
        </h3>
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span aria-hidden>
            <Avatar name={review.nome} size="sm" />
          </span>
          <span className="truncate text-foreground/90">{review.nome}</span>
          <CompactRating value={review.nota} className="ml-auto shrink-0" />
        </div>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {review.comentario}
        </p>
        <time dateTime={review.created_at} className="mt-auto text-xs text-subtle-foreground">
          {formatDateTime(review.created_at)}
        </time>
      </div>
    </article>
  )
}

function RecentReviewSkeleton() {
  return (
    <div aria-hidden className="flex gap-4 rounded-card bg-surface p-4">
      <Skeleton className="aspect-2/3 w-16 shrink-0 rounded-xl md:w-20" />
      <div className="flex flex-1 flex-col gap-2.5">
        <Skeleton className="h-4 w-3/4 rounded-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-3.5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-5/6 rounded-full" />
      </div>
    </div>
  )
}
