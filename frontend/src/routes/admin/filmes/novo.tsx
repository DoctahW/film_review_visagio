import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { pageContainer } from '@/components/layout/app-shell'
import { buttonVariants } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { genresQueryOptions } from '@/modules/genres'
import { emptyMovieForm, MovieForm, useCreateMovie, type MovieCreate } from '@/modules/movies'

export const Route = createFileRoute('/admin/filmes/novo')({
  // Sugestões de gênero do formulário.
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(genresQueryOptions)
  },
  component: MovieCreatePage,
})

function MovieCreatePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const createMovie = useCreateMovie()

  async function handleSubmit(body: MovieCreate) {
    const movie = await createMovie.mutateAsync(body)
    toast.success('Filme cadastrado', movie.titulo)
    await navigate({ to: '/admin/filmes/$movieId', params: { movieId: movie.sk_movie_id } })
  }

  return (
    <div className={cn(pageContainer, 'flex flex-col gap-8 py-6 md:py-10')}>
      <header className="flex flex-col gap-3">
        <Link
          to="/admin"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-3 self-start')}
        >
          <ArrowLeft aria-hidden />
          Filmes
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Novo filme</h1>
          <p className="text-sm text-muted-foreground">
            Preencha os dados para adicionar o filme ao catálogo.
          </p>
        </div>
      </header>
      <MovieForm
        initialValues={emptyMovieForm}
        submitLabel="Cadastrar filme"
        onSubmit={handleSubmit}
        onCancel={() => void navigate({ to: '/admin' })}
      />
    </div>
  )
}
