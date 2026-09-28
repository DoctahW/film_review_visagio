import { MessagesSquare } from 'lucide-react'
import { useId, useRef, useState } from 'react'

import { SectionHeading } from '@/components/section-heading'
import { ErrorState, StateMessage } from '@/components/state-message'
import { Pagination } from '@/components/ui/pagination'
import { formatInteger } from '@/lib/format'
import { cn } from '@/lib/utils'

import { useMovieReviews } from '../hooks/use-movie-reviews'
import { ReviewItem, ReviewItemSkeleton } from './review-item'

type MovieReviewsProps = {
  movieId: string
  className?: string
}

/** Histórico de avaliações do filme, mais recentes primeiro, com paginação própria. */
export function MovieReviews({ movieId, className }: MovieReviewsProps) {
  const [page, setPage] = useState(1)
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useMovieReviews(
    movieId,
    page,
  )
  const headingId = useId()
  const sectionRef = useRef<HTMLElement>(null)

  function changePage(next: number) {
    setPage(next)
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section
      ref={sectionRef}
      aria-labelledby={headingId}
      aria-busy={isPlaceholderData}
      className={cn('flex scroll-mt-24 flex-col gap-5', className)}
    >
      <SectionHeading id={headingId}>
        Avaliações
        {data && data.total > 0 && (
          <span className="ml-2 font-medium text-muted-foreground tabular-nums">
            {formatInteger(data.total)}
          </span>
        )}
      </SectionHeading>

      {isPending ? (
        <div className="flex flex-col gap-3">
          <ReviewItemSkeleton />
          <ReviewItemSkeleton />
          <ReviewItemSkeleton />
        </div>
      ) : isError ? (
        <ErrorState
          title="Não foi possível carregar as avaliações"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : data.items.length === 0 ? (
        <StateMessage
          icon={MessagesSquare}
          title="Ninguém avaliou este filme ainda"
          description="Quando alguém publicar uma avaliação, ela aparece aqui."
        />
      ) : (
        <>
          <ul
            className={cn(
              'flex flex-col gap-3 transition-opacity',
              isPlaceholderData && 'opacity-60',
            )}
          >
            {data.items.map((review) => (
              <li key={review.sk_movie_review_id}>
                <ReviewItem review={review} />
              </li>
            ))}
          </ul>
          <Pagination page={page} pages={data.pages} onPageChange={changePage} />
        </>
      )}
    </section>
  )
}
