import { createFileRoute } from '@tanstack/react-router'

import { NotFoundPage } from '@/components/not-found-page'
import { ensureMovie } from '@/modules/movies'

// Layout do filme na administração: detalhe e edição leem o filme do cache preenchido aqui.
export const Route = createFileRoute('/admin/filmes/$movieId')({
  loader: ({ context: { queryClient }, params: { movieId } }) => ensureMovie(queryClient, movieId),
  notFoundComponent: () => (
    <NotFoundPage
      title="Filme não encontrado"
      description="Ele pode ter sido excluído ou o endereço está incorreto."
    />
  ),
})
