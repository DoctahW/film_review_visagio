import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useId, useState } from 'react'

import { pageContainer } from '@/components/layout/app-shell'
import { SectionHeading } from '@/components/section-heading'
import { Button, buttonVariants } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { genresQueryOptions } from '@/modules/genres'
import {
  DeleteMovieDialog,
  MovieForm,
  movieToFormValues,
  useMovie,
  useUpdateMovie,
  type MovieCreate,
} from '@/modules/movies'

// O layout `admin/filmes/$movieId` já garante o filme no cache (`ensureMovie`).
export const Route = createFileRoute('/admin/filmes/$movieId/editar')({
  // Sugestões de gênero do formulário.
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(genresQueryOptions)
  },
  component: MovieEditPage,
})

function MovieEditPage() {
  const { movieId } = Route.useParams()
  const { data: movie } = useMovie(movieId)
  const navigate = useNavigate()
  const toast = useToast()
  const updateMovie = useUpdateMovie(movieId)

  const goToDetail = () => navigate({ to: '/admin/filmes/$movieId', params: { movieId } })

  // PUT substitui o filme inteiro (D15): o corpo validado leva todos os campos do formulário.
  async function handleSubmit(body: MovieCreate) {
    const saved = await updateMovie.mutateAsync(body)
    toast.success('Alterações salvas', saved.titulo)
    await goToDetail()
  }

  return (
    <div className={cn(pageContainer, 'flex flex-col gap-8 py-6 md:py-10')}>
      <header className="flex flex-col gap-3">
        <Link
          to="/admin/filmes/$movieId"
          params={{ movieId }}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-3 self-start')}
        >
          <ArrowLeft aria-hidden />
          Voltar ao filme
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Editar filme</h1>
          <p className="text-base font-medium text-muted-foreground md:text-lg">{movie.titulo}</p>
        </div>
      </header>

      <MovieForm
        initialValues={movieToFormValues(movie)}
        submitLabel="Salvar alterações"
        onSubmit={handleSubmit}
        onCancel={() => void goToDetail()}
      />

      <DangerZone movie={movie} onDeleted={() => void navigate({ to: '/admin' })} />
    </div>
  )
}

type DangerZoneProps = {
  movie: { sk_movie_id: string; titulo: string }
  onDeleted: () => void
}

/**
 * Guarda o estado do diálogo fora da página: fechar o diálogo depois da exclusão não re-renderiza
 * quem chama `useMovie`, que buscaria de novo o filme já removido do cache.
 */
function DangerZone({ movie, onDeleted }: DangerZoneProps) {
  const [open, setOpen] = useState(false)
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-card border border-danger/40 p-5 md:flex-row md:items-center md:justify-between md:gap-8 md:p-6"
    >
      <div className="flex flex-col gap-3">
        <SectionHeading id={headingId}>Excluir filme</SectionHeading>
        <p className="text-sm text-muted-foreground">
          Remove o filme e todas as avaliações dele. Esta ação não pode ser desfeita.
        </p>
      </div>
      <Button variant="danger" className="md:self-center" onClick={() => setOpen(true)}>
        <Trash2 aria-hidden />
        Excluir filme
      </Button>
      <DeleteMovieDialog movie={movie} open={open} onOpenChange={setOpen} onDeleted={onDeleted} />
    </section>
  )
}
