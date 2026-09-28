import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/toast'
import { isApiError } from '@/lib/api'

import { useDeleteMovie } from '../hooks/use-movie-mutations'

type DeleteMovieDialogProps = {
  movie: { sk_movie_id: string; titulo: string }
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Chamado depois que o diálogo fecha com a exclusão confirmada (ex.: navegar para a lista). */
  onDeleted?: () => void
}

/**
 * Confirmação de exclusão de filme. Quem abre deve manter o estado `open` fora do componente
 * que lê o filme com `useMovie`: a exclusão tira o detalhe do cache.
 */
export function DeleteMovieDialog({
  movie,
  open,
  onOpenChange,
  onDeleted,
}: DeleteMovieDialogProps) {
  const deleteMovie = useDeleteMovie()
  const toast = useToast()

  function handleConfirm() {
    deleteMovie.mutate(movie.sk_movie_id, {
      onSuccess: () => {
        toast.success('Filme excluído', movie.titulo)
        onOpenChange(false)
        onDeleted?.()
      },
      onError: (error) => {
        toast.error(
          'Não foi possível excluir o filme',
          isApiError(error) && error.message ? error.message : 'Tente novamente.',
        )
      },
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      tone="danger"
      title={`Excluir "${movie.titulo}"?`}
      description="As avaliações também serão removidas. Esta ação não pode ser desfeita."
      confirmLabel="Excluir filme"
      pending={deleteMovie.isPending}
      onConfirm={handleConfirm}
    />
  )
}
