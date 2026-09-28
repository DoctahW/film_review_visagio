import { useId } from 'react'

import { applyApiErrors, useAppForm } from '@/components/form'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

import { useCreateReview } from '../hooks/use-create-review'
import { emptyReviewForm, reviewFormSchema } from '../schemas/review-form.schema'

type ReviewFormProps = {
  movieId: string
  onCreated?: () => void
  className?: string
}

export function ReviewForm({ movieId, onCreated, className }: ReviewFormProps) {
  const headingId = useId()
  const toast = useToast()
  const createReview = useCreateReview(movieId)

  const form = useAppForm({
    defaultValues: emptyReviewForm,
    validators: { onSubmit: reviewFormSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        // Resolve só depois de invalidar lista e média: ao limpar, a tela já mostra a nova nota.
        await createReview.mutateAsync(reviewFormSchema.parse(value))
      } catch (error) {
        const message = applyApiErrors(formApi, error)
        if (message) toast.error('Não foi possível publicar a avaliação', message)
        return
      }
      formApi.reset()
      toast.success('Avaliação publicada', 'A média do filme já foi atualizada.')
      onCreated?.()
    },
  })

  return (
    <section
      aria-labelledby={headingId}
      className={cn('flex flex-col gap-5 rounded-card border border-border p-5 md:p-6', className)}
    >
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="text-lg font-bold tracking-tight">
          Avaliar este filme
        </h2>
        <p className="text-sm text-muted-foreground">Dê uma nota de 0 a 10 e conte o que achou.</p>
      </div>
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
      >
        <form.AppField name="nome">
          {(field) => <field.TextField label="Nome" autoComplete="name" />}
        </form.AppField>
        <form.AppField name="nota">{(field) => <field.RatingField label="Nota" />}</form.AppField>
        <form.AppField name="comentario">
          {(field) => (
            <field.TextareaField
              label="Comentário"
              placeholder="O que funcionou, o que não funcionou…"
              rows={5}
              maxLength={4000}
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton pendingLabel="Publicando…" className="w-full sm:w-auto sm:self-start">
            Publicar avaliação
          </form.SubmitButton>
        </form.AppForm>
      </form>
    </section>
  )
}
