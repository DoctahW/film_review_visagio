import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { DeleteMovieDialog, MovieDetailView, useMovie } from '@/modules/movies'
import { MovieReviews, ReviewForm } from '@/modules/reviews'

// Detalhe na administração: mesmas informações do site + editar, excluir e nova avaliação.
// O filme já está no cache pelo loader do layout (`$movieId/route.tsx`).
export const Route = createFileRoute('/admin/filmes/$movieId/')({
  component: AdminMovieDetailPage,
})

function AdminMovieDetailPage() {
  const { movieId } = Route.useParams()
  const { data: movie } = useMovie(movieId)
  // Nova avaliação entra no topo da página 1: remontar a lista volta para ela.
  const [reviewsVersion, setReviewsVersion] = useState(0)

  return (
    <MovieDetailView
      movie={movie}
      backLink={
        <Link to="/admin" className={buttonVariants({ variant: 'glass' })}>
          <ArrowLeft aria-hidden />
          Filmes
        </Link>
      }
      actions={
        <>
          <Link
            to="/admin/filmes/$movieId/editar"
            params={{ movieId }}
            className={buttonVariants({ variant: 'secondary' })}
          >
            <Pencil aria-hidden />
            Editar
          </Link>
          <DeleteMovieAction movie={movie} />
        </>
      }
    >
      <div className="grid gap-10 lg:grid-cols-[27rem_minmax(0,1fr)] lg:items-start lg:gap-14">
        <ReviewForm
          movieId={movieId}
          onCreated={() => setReviewsVersion((version) => version + 1)}
          className="lg:sticky lg:top-24"
        />
        <MovieReviews key={reviewsVersion} movieId={movieId} />
      </div>
    </MovieDetailView>
  )
}

/**
 * Estado do diálogo isolado aqui: a exclusão tira o filme do cache, e re-renderizar a página
 * (que lê `useMovie`) antes da navegação buscaria o filme de novo e cairia no 404.
 */
function DeleteMovieAction({ movie }: { movie: { sk_movie_id: string; titulo: string } }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      <Button
        variant="ghost"
        className="text-danger hover:not-data-disabled:bg-danger/10 hover:not-data-disabled:text-danger"
        onClick={() => setOpen(true)}
      >
        <Trash2 aria-hidden />
        Excluir
      </Button>
      <DeleteMovieDialog
        movie={movie}
        open={open}
        onOpenChange={setOpen}
        onDeleted={() => void navigate({ to: '/admin' })}
      />
    </>
  )
}
